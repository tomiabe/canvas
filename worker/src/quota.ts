// One global Durable Object, backed by SQLite durable storage. Every read/modify/write
// runs in a storage transaction (not an isolate-local counter).
export interface Storage {
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
  transaction<T>(callback: (storage: Storage) => Promise<T>): Promise<T>;
}
export interface QuotaNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(request: Request): Promise<Response> };
}
export interface Usage {
  limit: 10;
  remaining: number;
  resetsAt: string;
  reason?: 'daily' | 'burst' | 'global';
  retryAt?: string;
}
interface Visitor { submissions: Record<string, number>; burst: number[] }
interface Ledger { day: string; attempts: number; visitors: Record<string, Visitor> }

export class QuotaLimiter {
  constructor(private state: { storage: Storage }, private env: { GLOBAL_DAILY_ATTEMPT_LIMIT?: string }) {}

  async fetch(request: Request): Promise<Response> {
    const { identity, submissionId, action } = await request.json() as { identity: string; submissionId?: string; action: 'usage' | 'submission' | 'attempt' };
    const cap = Number(this.env.GLOBAL_DAILY_ATTEMPT_LIMIT ?? '100');
    if (!Number.isSafeInteger(cap) || cap < 1) throw new Error('Invalid global budget');
    const result = await this.state.storage.transaction(async storage => {
      const now = Date.now();
      const day = new Date(now).toISOString().slice(0, 10);
      const resetsAt = new Date(`${day}T00:00:00.000Z`).getTime() + 86400000;
      let ledger = await storage.get<Ledger>('ledger');
      if (!ledger || ledger.day !== day) ledger = { day, attempts: 0, visitors: {} };
      const visitor = ledger.visitors[identity] ?? { submissions: {}, burst: [] };
      visitor.burst = visitor.burst.filter(time => time > now - 60000);
      const usage: Usage = { limit: 10, remaining: Math.max(0, 10 - Object.keys(visitor.submissions).length), resetsAt: new Date(resetsAt).toISOString() };
      const deny = (reason: Usage['reason'], retry = resetsAt, error = 'AI allowance exhausted') => ({ allowed: false, error, usage: { ...usage, reason, retryAt: new Date(retry).toISOString() } });
      if (ledger.attempts >= cap) return deny('global', resetsAt, 'Global daily AI budget exhausted');
      const count = submissionId ? visitor.submissions[submissionId] ?? 0 : 0;
      if (action === 'submission') {
        if (count >= 3) return deny('daily', resetsAt, 'Submission request limit reached (initial request plus two repairs)');
        if (!count && usage.remaining === 0) return deny('daily');
        if (!count && visitor.burst.length >= 3) return deny('burst', visitor.burst[0] + 60000, 'Too many new submissions; wait before trying again');
        if (!submissionId) throw new Error('Missing submission ID');
        if (!count) { visitor.burst.push(now); usage.remaining--; }
        visitor.submissions[submissionId] = count + 1;
        ledger.visitors[identity] = visitor;
      } else if (action === 'attempt') {
        if (!count) throw new Error('Submission not reserved for this day');
        ledger.attempts++;
      } else {
        if (usage.remaining === 0) return deny('daily');
        if (visitor.burst.length >= 3) return deny('burst', visitor.burst[0] + 60000);
      }
      await storage.put('ledger', ledger);
      if (ledger.attempts >= cap) {
        usage.reason = 'global'; usage.retryAt = usage.resetsAt;
      } else if (usage.remaining === 0) {
        usage.reason = 'daily'; usage.retryAt = usage.resetsAt;
      } else if (visitor.burst.length >= 3) {
        usage.reason = 'burst'; usage.retryAt = new Date(visitor.burst[0] + 60000).toISOString();
      }
      return { allowed: true, usage };
    });
    return Response.json(result);
  }
}
