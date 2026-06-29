import { Template } from '../types';

export const maurerRoseTemplate: Template = {
  id: 'maurer-rose',
  name: 'Maurer Rose',
  description: 'Mathematical rose curves with rotating line segments.',
  category: 'geometry',
  params: [
    { id: 'n', name: 'N (petals)', type: 'number', default: 6, min: 2, max: 20, step: 1, category: 'geometry', description: 'Number of petals' },
    { id: 'd', name: 'D (delta)', type: 'number', default: 71, min: 1, max: 180, step: 1, category: 'geometry', description: 'Angular step size (affects complexity)' },
    { id: 'size', name: 'Size', type: 'number', default: 250, min: 50, max: 500, step: 10, category: 'geometry', suffix: 'px', description: 'Maximum radius' },
    { id: 'points', name: 'Points', type: 'number', default: 360, min: 60, max: 720, step: 10, category: 'geometry', description: 'Number of connected points' },
    { id: 'animate', name: 'Animate', type: 'boolean', default: true, category: 'animation', description: 'Rotating animation' },
    { id: 'lineColor', name: 'Line Color', type: 'color', default: '#ff6b9d', category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a0a', category: 'color' }
  ],
  presets: [
    {
      name: 'Sunburst',
      params: { n: 7, d: 85, size: 300, points: 360, animate: true, lineColor: '#ffd700', bgColor: '#0a0a0a' }
    },
    {
      name: 'Vintage Lace',
      params: { n: 5, d: 97, size: 200, points: 720, animate: false, lineColor: '#c77dff', bgColor: '#1a1a2e' }
    }
  ],
  generateCode: (params, seed) => `
    function setup() {
      createCanvas(windowWidth, windowHeight);
      background('${params.bgColor}');
    }

    function draw() {
      background('${params.bgColor}');
      translate(width / 2, height / 2);

      let n = ${params.n};
      let d = ${params.d};
      let size = ${params.size};
      let numPoints = ${params.points};
      let rotation = ${params.animate} ? frameCount * 0.005 : 0;

      stroke('${params.lineColor}');
      noFill();
      strokeWeight(1.5);

      beginShape();
      for (let i = 0; i <= numPoints; i++) {
        let k = i * d;
        let angle = radians(k) + rotation;
        let r = size * sin(n * angle);
        let x = r * cos(angle);
        let y = r * sin(angle);
        vertex(x, y);
      }
      endShape(CLOSE);

      if (!${params.animate}) noLoop();
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
