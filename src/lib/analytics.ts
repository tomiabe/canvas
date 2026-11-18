type GenerationMode = 'new' | 'refine';
type ExportType = 'png' | 'gif' | 'video' | 'js';

function send(name: string, params: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.('event', name, params);
}

// Only categorical outcomes are sent. Prompts, sketch code and control values stay out of analytics.
export const analytics = {
  generation: (mode: GenerationMode, result: 'success' | 'failure') => send('sketch_generation', { mode, result }),
  feedback: (result: 'matched' | 'needs_work') => send('sketch_feedback', { result }),
  export: (type: ExportType, result: 'success' | 'failure') => send('sketch_export', { type, result }),
  share: (action: 'created' | 'opened' | 'failed') => send('sketch_share', { action }),
};
