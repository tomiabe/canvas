import { Template } from '../types';

export const circlePackingTemplate: Template = {
  id: 'circle-packing',
  name: 'Circle Packing',
  description: 'Circles that grow and pack together without overlapping.',
  category: 'geometry',
  params: [
    { id: 'count', name: 'Circle Count', type: 'number', default: 500, min: 50, max: 2000, step: 50, category: 'geometry', description: 'Number of circles to pack' },
    { id: 'maxSize', name: 'Max Size', type: 'number', default: 80, min: 20, max: 200, step: 10, category: 'geometry', suffix: 'px', description: 'Maximum circle diameter' },
    { id: 'padding', name: 'Padding', type: 'number', default: 2, min: 0, max: 10, step: 1, category: 'layout', description: 'Gap between circles' },
    { id: 'speed', name: 'Growth Speed', type: 'number', default: 1, min: 0.5, max: 5, step: 0.5, category: 'animation', description: 'How fast circles grow' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a1a', category: 'color' }
  ],
  presets: [
    {
      name: 'Bubble Tea',
      params: { count: 800, maxSize: 60, padding: 1, speed: 1, palette: ['#ff9a9e', '#fad0c4', '#a18cd1', '#fbc2eb', '#f6d365'], bgColor: '#1a1a2e' }
    },
    {
      name: 'Target Practice',
      params: { count: 200, maxSize: 150, padding: 4, speed: 0.5, palette: ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff'], bgColor: '#000000' }
    }
  ],
  generateCode: (params, seed) => `
    let circles = [];
    let palette = ${JSON.stringify(params.palette)};
    let attempts = 0;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      background('${params.bgColor}');
      noStroke();
    }

    function draw() {
      let maxAttempts = 100;
      for (let a = 0; a < maxAttempts; a++) {
        if (circles.length >= ${params.count}) {
          noLoop();
          return;
        }

        let x = random(width);
        let y = random(height);
        let valid = true;
        let minDist = ${params.maxSize};

        for (let c of circles) {
          let d = dist(x, y, c.x, c.y);
          if (d < c.r + ${params.padding}) {
            valid = false;
            break;
          }
          minDist = min(minDist, d - c.r - ${params.padding});
        }

        if (valid) {
          let r = min(minDist, ${params.maxSize} / 2);
          if (r < 2) continue;
          circles.push({ x, y, r, targetR: r, color: random(palette) });
        }
        attempts++;
        if (attempts > 5000) { noLoop(); return; }
      }

      // Draw
      for (let c of circles) {
        c.r = lerp(c.r, c.targetR, 0.05 * ${params.speed});
        fill(c.color);
        circle(c.x, c.y, c.r * 2);
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
