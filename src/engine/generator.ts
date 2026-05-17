import { SketchConfig } from '../types';
import { templates } from '../templates';

export function generateHtml(config: SketchConfig): string {
  let sketchCode: string;

  if (config.customCode) {
    sketchCode = config.customCode;
  } else {
    const template = templates[config.templateId];
    if (!template) return '';
    sketchCode = template.generateCode(config.params, config.seed);
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Canvas Sketch</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
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
    
    // Add a function to export canvas
    function exportCanvas() {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'canvas-export.png';
        link.href = dataUrl;
        link.click();
      }
    }
    
    // Listen for messages from parent
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'export') {
        exportCanvas();
      }
    });
  </script>
</body>
</html>
`;
}
