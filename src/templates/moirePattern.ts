import { Template } from '../types';

export const moirePatternTemplate: Template = {
  id: 'moire-pattern',
  name: 'Moiré Pattern',
  description: 'Overlapping grids create mesmerizing optical interference patterns.',
  params: [
    { id: 'type', name: 'Pattern Type', type: 'enum', default: 'circles', options: ['circles', 'lines', 'radial', 'dots'] },
    { id: 'spacing', name: 'Line Spacing', type: 'number', default: 12, min: 4, max: 40, step: 1 },
    { id: 'rotOffset', name: 'Rotation Offset', type: 'number', default: 3, min: 0, max: 30, step: 0.5 },
    { id: 'speed', name: 'Rotation Speed', type: 'number', default: 0.1, min: 0, max: 1, step: 0.05 },
    { id: 'lineColor', name: 'Line Color', type: 'color', default: '#ffffff' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000' },
    { id: 'thickness', name: 'Line Thickness', type: 'number', default: 1, min: 0.3, max: 4, step: 0.1 },
  ],
  presets: [
    { name: 'Classic', params: { type: 'lines', spacing: 10, rotOffset: 5, speed: 0.15, lineColor: '#ffffff', bgColor: '#000000', thickness: 1 } },
    { name: 'Ripple', params: { type: 'circles', spacing: 15, rotOffset: 2, speed: 0.08, lineColor: '#00ffcc', bgColor: '#000a08', thickness: 1.2 } },
    { name: 'Psychedelic', params: { type: 'radial', spacing: 8, rotOffset: 10, speed: 0.4, lineColor: '#ff00ff', bgColor: '#000000', thickness: 0.8 } },
  ],
  generateCode: (params, seed) => `
    let t = 0;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      angleMode(DEGREES);
    }

    function drawPattern(rotation) {
      let sp = ${params.spacing};
      let type = '${params.type}';
      push();
      translate(width/2, height/2);
      rotate(rotation);
      stroke('${params.lineColor}');
      strokeWeight(${params.thickness});
      noFill();

      if (type === 'lines') {
        for (let x = -width; x < width; x += sp) {
          line(x, -height, x, height);
        }
      } else if (type === 'circles') {
        let maxR = sqrt(width*width + height*height);
        for (let r = sp; r < maxR; r += sp) {
          circle(0, 0, r * 2);
        }
      } else if (type === 'radial') {
        let maxR = sqrt(width*width + height*height);
        let steps = floor(360 / (sp * 0.5));
        for (let a = 0; a < 360; a += 360/steps) {
          let rad = radians(a);
          line(0, 0, cos(rad) * maxR, sin(rad) * maxR);
        }
      } else {
        // dots
        for (let x = -width; x < width; x += sp) {
          for (let y = -height; y < height; y += sp) {
            point(x, y);
          }
        }
      }
      pop();
    }

    function draw() {
      background('${params.bgColor}');
      drawPattern(t);
      drawPattern(t + ${params.rotOffset});
      t += ${params.speed};
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
