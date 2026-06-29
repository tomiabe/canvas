import { Template } from '../types';

export const phyllotaxisTemplate: Template = {
  id: 'phyllotaxis',
  name: 'Phyllotaxis',
  description: 'Fibonacci spiral pattern found in sunflowers and pinecones.',
  category: 'geometry',
  params: [
    { id: 'count', name: 'Point Count', type: 'number', default: 500, min: 50, max: 3000, step: 50, category: 'geometry', description: 'Number of points in the spiral' },
    { id: 'divergence', name: 'Divergence Angle', type: 'number', default: 137.5, min: 130, max: 180, step: 0.5, category: 'geometry', suffix: '°', description: 'Angle between successive points (golden angle ~137.5)' },
    { id: 'scale', name: 'Scale', type: 'number', default: 4, min: 1, max: 15, step: 0.5, category: 'geometry', description: 'Spacing between points' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a0a', category: 'color' }
  ],
  presets: [
    {
      name: 'Sunflower',
      params: { count: 1000, divergence: 137.5, scale: 3, palette: ['#ffd700', '#ffaa00', '#ff8800', '#8b4513'], bgColor: '#1a0a00' }
    },
    {
      name: 'Galaxy Spiral',
      params: { count: 2000, divergence: 140, scale: 2, palette: ['#00b4d8', '#90e0ef', '#caf0f8', '#ffffff', '#ff6b9d'], bgColor: '#000010' }
    }
  ],
  generateCode: (params, seed) => `
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      background('${params.bgColor}');
      noStroke();
      translate(width / 2, height / 2);

      let n = ${params.count};
      let angle = radians(${params.divergence});
      let scale = ${params.scale};

      for (let i = 0; i < n; i++) {
        let r = scale * sqrt(i);
        let theta = i * angle;
        let x = cos(theta) * r;
        let y = sin(theta) * r;

        let c = color(palette[i % palette.length]);
        let alpha = map(i, 0, n, 50, 255);
        c.setAlpha(alpha);
        fill(c);

        let size = map(i, 0, n, 2, 6);
        circle(x, y, size);
      }
    }

    function draw() { noLoop(); }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      background('${params.bgColor}');
      translate(width / 2, height / 2);
      let n = ${params.count};
      let angle = radians(${params.divergence});
      let scale = ${params.scale};
      for (let i = 0; i < n; i++) {
        let r = scale * sqrt(i);
        let theta = i * angle;
        let x = cos(theta) * r;
        let y = sin(theta) * r;
        let c = color(palette[i % palette.length]);
        let alpha = map(i, 0, n, 50, 255);
        c.setAlpha(alpha);
        fill(c);
        let size = map(i, 0, n, 2, 6);
        circle(x, y, size);
      }
    }
  `
};
