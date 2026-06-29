import { Template } from '../types';

export const halftoneTemplate: Template = {
  id: 'halftone',
  name: 'Halftone',
  description: 'Halftone dot pattern effect on procedural shapes.',
  category: 'image',
  params: [
    { id: 'dotSize', name: 'Dot Size', type: 'number', default: 8, min: 2, max: 30, step: 1, category: 'layout', suffix: 'px', description: 'Max dot diameter' },
    { id: 'spacing', name: 'Dot Spacing', type: 'number', default: 12, min: 4, max: 40, step: 1, category: 'layout', suffix: 'px', description: 'Distance between dot centers' },
    { id: 'shape', name: 'Source Shape', type: 'enum', default: 'circle', options: ['circle', 'square', 'triangle', 'text', 'gradient'], category: 'geometry', description: 'Shape to render as halftone' },
    { id: 'color1', name: 'Color 1', type: 'color', default: '#000000', category: 'color' },
    { id: 'color2', name: 'Color 2', type: 'color', default: '#ffffff', category: 'color' },
    { id: 'angle', name: 'Screen Angle', type: 'number', default: 0, min: 0, max: 180, step: 5, category: 'layout', suffix: '°', description: 'Halftone screen rotation' }
  ],
  presets: [
    {
      name: 'Comic Book',
      params: { dotSize: 6, spacing: 10, shape: 'circle', color1: '#000000', color2: '#ffffff', angle: 45 }
    },
    {
      name: 'Pop Art',
      params: { dotSize: 15, spacing: 20, shape: 'text', color1: '#ff0054', color2: '#ffd700', angle: 0 }
    }
  ],
  generateCode: (params, seed) => `
    let source;
    let res = ${params.spacing};
    let maxDot = ${params.dotSize};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      noStroke();
      generateSource();
      renderHalftone();
    }

    function generateSource() {
      source = createGraphics(width, height);
      let shape = '${params.shape}';

      if (shape === 'circle') {
        source.background(255);
        source.fill(0);
        source.noStroke();
        source.circle(width / 2, height / 2, min(width, height) * 0.7);
      } else if (shape === 'square') {
        source.background(255);
        source.fill(0);
        source.rectMode(CENTER);
        source.rect(width / 2, height / 2, min(width, height) * 0.6);
      } else if (shape === 'triangle') {
        source.background(255);
        source.fill(0);
        source.triangle(width / 2, height * 0.2, width * 0.2, height * 0.8, width * 0.8, height * 0.8);
      } else if (shape === 'text') {
        source.background(255);
        source.fill(0);
        source.textAlign(CENTER, CENTER);
        source.textSize(200);
        source.textStyle(BOLD);
        source.text('DOT', width / 2, height / 2);
      } else {
        for (let x = 0; x < width; x++) {
          let c = map(x, 0, width, 0, 255);
          source.stroke(c);
          source.line(x, 0, x, height);
        }
      }
      source.loadPixels();
    }

    function renderHalftone() {
      background(${params.color2 === '#ffffff' ? 255 : 255});
      let angle = radians(${params.angle});

      push();
      translate(width / 2, height / 2);
      rotate(angle);
      translate(-width / 2, -height / 2);

      for (let x = 0; x < width; x += res) {
        for (let y = 0; y < height; y += res) {
          let cx = x + res / 2;
          let cy = y + res / 2;
          let idx = (floor(cx) + floor(cy) * width) * 4;
          if (idx < source.pixels.length) {
            let r = source.pixels[idx];
            let g = source.pixels[idx + 1];
            let b = source.pixels[idx + 2];
            let bright = (r + g + b) / 3;
            let dotR = map(bright, 0, 255, maxDot / 2, 0);

            if (dotR > 0.5) {
              fill('${params.color1}');
              circle(cx, cy, dotR * 2);
            }
          }
        }
      }
      pop();
      noLoop();
    }

    function draw() {}

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      generateSource();
      renderHalftone();
    }
  `
};
