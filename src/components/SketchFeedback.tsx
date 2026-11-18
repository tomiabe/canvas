import React, { useEffect, useState } from 'react';
import { analytics } from '../lib/analytics';

const KEY = 'canvas.feedback.v1';

function wasAnswered(id: string): boolean {
  try {
    const data = JSON.parse(window.sessionStorage.getItem(KEY) || '{}');
    return data[id] === true;
  } catch {
    return false;
  }
}

export function SketchFeedback({ versionId, onNeedsWork }: { versionId: string; onNeedsWork: () => void }) {
  const [answered, setAnswered] = useState(() => wasAnswered(versionId));
  useEffect(() => setAnswered(wasAnswered(versionId)), [versionId]);
  if (answered) return null;

  const answer = (result: 'matched' | 'needs_work') => {
    analytics.feedback(result);
    setAnswered(true);
    try {
      const data = JSON.parse(window.sessionStorage.getItem(KEY) || '{}');
      data[versionId] = true;
      window.sessionStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Feedback can still be given when browser storage is unavailable.
    }
    if (result === 'needs_work') onNeedsWork();
  };

  return (
    <div className="rounded-lg border border-canvas-line bg-canvas-raised p-3 text-canvas-text shadow-lg">
      <p className="text-[13px] font-medium">Did this sketch match your idea?</p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => answer('matched')} className="min-h-9 rounded-md bg-canvas-white px-3 text-xs font-semibold text-canvas-bg">Yes</button>
        <button type="button" onClick={() => answer('needs_work')} className="min-h-9 rounded-md border border-canvas-white/20 px-3 text-xs">Needs work</button>
      </div>
    </div>
  );
}
