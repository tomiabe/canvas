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
    
    // Export results are reported to the parent so failures are visible.
    function exportPng() {
      try {
        const canvas = document.querySelector('canvas');
        if (!canvas) throw new Error('There is no sketch to export yet.');
        const link = document.createElement('a');
        link.download = 'canvas-export.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        window.reportSketch('export-success', 'png');
      } catch (error) {
        window.reportSketch('export-error', 'PNG export failed: ' + error.message);
      }
    }

    async function exportGif(duration, fps) {
      const still = typeof isLooping === 'function' && !isLooping();
      try {
        if (typeof saveGif !== 'function') throw new Error('GIF export is unavailable in this browser.');
        await saveGif('canvas-export.gif', duration, { fps: fps || 15, units: 'seconds' });
        window.reportSketch('export-success', 'gif');
      } catch (error) {
        window.reportSketch('export-error', 'GIF export failed: ' + error.message);
      } finally {
        // p5.saveGif unconditionally calls loop(), even for a static painting.
        if (still) noLoop();
      }
    }

    function exportVideo(duration) {
      let stream;
      let frameTimer;
      try {
        const canvas = document.querySelector('canvas');
        if (!canvas) throw new Error('There is no sketch to export yet.');
        if (!window.MediaRecorder || !canvas.captureStream) throw new Error('Video recording is unavailable in this browser.');
        // Keep static paintings still while recording frames from a snapshot surface.
        const still = typeof isLooping === 'function' && !isLooping();
        const surface = still ? document.createElement('canvas') : canvas;
        if (still) { surface.width = canvas.width; surface.height = canvas.height; }
        const snapshot = still ? surface.getContext('2d') : null;
        stream = surface.captureStream(still ? 0 : 30);
        const candidates = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'];
        const mimeType = typeof MediaRecorder.isTypeSupported === 'function'
          ? candidates.find(type => MediaRecorder.isTypeSupported(type)) : undefined;
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        const chunks = [];
        recorder.ondataavailable = function(event) {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onerror = function() {
          window.reportSketch('export-error', 'Video recording stopped unexpectedly.');
        };
        recorder.onstop = function() {
          clearInterval(frameTimer);
          stream.getTracks().forEach(function(track) { track.stop(); });
          if (!chunks.length) {
            window.reportSketch('export-error', 'Video recording produced no frames.');
            return;
          }
          const actualType = recorder.mimeType || mimeType || 'video/webm';
          const blob = new Blob(chunks, { type: actualType });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'canvas-export.' + (actualType.includes('mp4') ? 'mp4' : 'webm');
          link.click();
          setTimeout(function() { URL.revokeObjectURL(url); }, 30000);
          window.reportSketch('export-success', 'video');
        };
        recorder.start();
        if (snapshot) {
          const frame = function() {
            snapshot.drawImage(canvas, 0, 0);
            stream.getVideoTracks()[0].requestFrame?.();
          };
          frame();
          frameTimer = setInterval(frame, 1000 / 30);
        }
        setTimeout(function() { if (recorder.state === 'recording') recorder.stop(); }, duration * 1000);
      } catch (error) {
        clearInterval(frameTimer);
        stream?.getTracks().forEach(function(track) { track.stop(); });
        window.reportSketch('export-error', 'Video export failed: ' + error.message);
      }
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
