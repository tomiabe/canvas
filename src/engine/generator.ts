import { SketchConfig } from '../types';
import { templates } from '../templates';
import { parse } from 'acorn';
import { fullAncestor } from 'acorn-walk';

// Bound each loop invocation, including loops inside setup and event handlers.
// Parse real JavaScript: regex rewriting would corrupt strings, comments and labels.
export function limitSketchLoops(code: string, budgetMs = 100): string {
  const edits: { position: number; depth: number; close: boolean; text: string }[] = [];
  let index = 0;
  fullAncestor(parse(code, { ecmaVersion: 'latest', sourceType: 'script' }), (node: any, _state, ancestors: any[]) => {
    if (!['ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement'].includes(node.type)) return;
    let start = node.start;
    for (let i = ancestors.length - 2; i >= 0 && ancestors[i].type === 'LabeledStatement'; i--) start = ancestors[i].start;
    // A unique binding avoids collisions with generated identifiers.
    let name = `__canvasLoop${index++}`;
    while (code.includes(name)) name += '_';
    const depth = ancestors.length;
    edits.push(
      { position: start, depth, close: false, text: `{let ${name}=performance.now()+${budgetMs};` },
      { position: node.body.start, depth: depth + 0.5, close: false, text: `{if(performance.now()>${name})throw new Error('Sketch loop exceeded ${budgetMs}ms. Reduce the work or fix the loop condition.');` },
      { position: node.body.end, depth: depth + 0.5, close: true, text: '}' },
      { position: node.end, depth, close: true, text: '}' },
    );
  });
  edits.sort((a, b) => a.position - b.position || Number(b.close) - Number(a.close) || (a.close ? b.depth - a.depth : a.depth - b.depth));
  let result = '', position = 0;
  for (const edit of edits) {
    result += code.slice(position, edit.position) + edit.text;
    position = edit.position;
  }
  return result + code.slice(position);
}

export function getSketchScripts(config: SketchConfig): string[] {
  const template = templates[config.templateId];
  // Metadata only: never interpolate caller-provided URLs. An explicit empty
  // selection overrides template defaults; old configs inherit those defaults.
  const libraries = new Set(config.libraries ?? template?.libraries ?? []);
  const p5Version = libraries.has('brush') ? '1.11.3' : '1.9.0';
  return [
    `https://cdnjs.cloudflare.com/ajax/libs/p5.js/${p5Version}/p5.min.js`,
    `https://cdnjs.cloudflare.com/ajax/libs/p5.js/${p5Version}/addons/p5.sound.min.js`,
    libraries.has('brush') && 'https://cdn.jsdelivr.net/npm/p5.brush@1.1.4/dist/p5.brush.js',
    libraries.has('grain') && 'https://cdn.jsdelivr.net/npm/p5.grain@0.8.0/dist/p5.grain.min.js',
  ].filter(Boolean) as string[];
}

export function generateHtml(config: SketchConfig, runId = ''): string {
  const template = templates[config.templateId];
  if (!template) return '';
  const code = template.generateCode(config.params, config.seed);
  // Natural-media strokes take longer than ordinary particle/geometry loops.
  const budgetMs = config.libraries?.includes('brush') ? 500 : 100;
  const sketchCode = config.templateId === 'custom-sketch' ? limitSketchLoops(code, budgetMs) : code;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Canvas Sketch</title>
  <script>
    window.reportSketch = function(type, message) {
      parent.postMessage({ type: type, message: String(message || ''), runId: ${JSON.stringify(runId)} }, '*');
    };
    window.onerror = function(message) { window.reportSketch('sketch-error', message); };
    window.addEventListener('unhandledrejection', function(event) {
      window.reportSketch('sketch-error', event.reason);
    });
  </script>
  ${getSketchScripts(config).map(url => `<script src="${url}"></script>`).join('\n')}
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #000;
    }
    canvas {
      display: block;
    }
  </style>
</head>
<body>
  <script>
    // The generated sketch code
    ${sketchCode}

    // A successful draw with a canvas is readiness, not a visual-quality score.
    if (typeof draw === 'function') {
      var originalDraw = draw;
      var reportedReady = false;
      draw = function() {
        originalDraw.apply(this, arguments);
        if (!reportedReady && document.querySelector('canvas')) {
          reportedReady = true;
          window.reportSketch('sketch-ready');
        }
      };
    }
    
    // Export functions
    function exportPng() {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'canvas-export.png';
        link.href = dataUrl;
        link.click();
      }
    }
    
    async function exportGif(duration, fps) {
      if (typeof saveGif !== 'function') {
        console.warn('saveGif not available');
        return;
      }
      const still = typeof isLooping === 'function' && !isLooping();
      try {
        await saveGif('canvas-export.gif', duration, { fps: fps || 15, units: 'seconds' });
      } finally {
        // p5.saveGif unconditionally calls loop(), even for a static painting.
        if (still) noLoop();
      }
    }
    
    function exportVideo(duration) {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      // noLoop paintings do not submit frames. Record a 2D snapshot surface
      // without restarting the painting or changing its random state.
      const still = typeof isLooping === 'function' && !isLooping();
      const surface = still ? document.createElement('canvas') : canvas;
      if (still) { surface.width = canvas.width; surface.height = canvas.height; }
      const snapshot = still ? surface.getContext('2d') : null;
      const stream = surface.captureStream(still ? 0 : 30);
      let frameTimer;
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/mp4';
        }
      }
      const recorder = new MediaRecorder(stream, { mimeType: mimeType });
      const chunks = [];
      recorder.ondataavailable = function(e) {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = function() {
        clearInterval(frameTimer);
        stream.getTracks().forEach(function(track) { track.stop(); });
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        var ext = mimeType.indexOf('mp4') !== -1 ? 'mp4' : 'webm';
        a.download = 'canvas-export.' + ext;
        a.click();
        URL.revokeObjectURL(url);
      };
      recorder.start();
      if (snapshot) {
        const frame = function() {
          snapshot.drawImage(canvas, 0, 0);
          stream.getVideoTracks()[0].requestFrame();
        };
        frame();
        frameTimer = setInterval(frame, 1000 / 30);
      }
      setTimeout(function() { recorder.stop(); }, duration * 1000);
    }
    
    // Listen for messages from parent
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'export') {
        var exportType = event.data.exportType;
        if (exportType === 'gif') {
          exportGif(event.data.duration || 3, event.data.fps || 15);
        } else if (exportType === 'video') {
          exportVideo(event.data.duration || 5);
        } else {
          exportPng();
        }
      }
    });
  </script>
</body>
</html>
`;
}
