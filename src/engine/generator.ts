import { SketchConfig } from '../types';
import { templates } from '../templates';

export function generateHtml(config: SketchConfig): string {
  const template = templates[config.templateId];
  if (!template) return '';

  const sketchCode = template.generateCode(config.params, config.seed);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Canvas Sketch</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/addons/p5.sound.min.js"></script>
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
    // Catch errors and send to parent
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      window.parent.postMessage({ type: 'sketch-error', message: msg }, '*');
      return false;
    };
    
    // The generated sketch code
    ${sketchCode}
    
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
    
    function exportGif(duration, fps) {
      if (typeof saveGif !== 'function') {
        console.warn('saveGif not available');
        return;
      }
      saveGif('canvas-export.gif', duration, { fps: fps || 15, units: 'seconds' });
    }
    
    function exportVideo(duration) {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const stream = canvas.captureStream(30);
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
