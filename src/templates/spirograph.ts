import { Template } from '../types';

export const spirographTemplate: Template = {
  id: 'spirograph',
  name: 'Spirograph',
  description: 'Mathematical spirograph curves using parametric equations.',
  category: 'geometry',
  params: [
    { id: 'innerRadius', name: 'Inner Radius', type: 'number', default: 80, min: 20, max: 300, step: 5, category: 'geometry', description: 'Radius of the fixed circle' },
    { id: 'outerRadius', name: 'Outer Radius', type: 'number', default: 200, min: 50, max: 500, step: 5, category: 'geometry', description: 'Radius of the rolling circle' },
    { id: 'distance', name: 'Pen Distance', type: 'number', default: 100, min: 0, max: 300, step: 5, category: 'geometry', description: 'Distance of pen from rolling circle center' },
    { id: 'speed', name: 'Speed', type: 'number', default: 0.5, min: 0.1, max: 3, step: 0.1, category: 'animation', description: 'Drawing speed multiplier' },
    { id: 'lineColor', name: 'Line Color', type: 'color', default: '#00e5ff', category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a0a', category: 'color' }
  ],
  presets: [
    {
      name: 'Flower of Life',
      params: { innerRadius: 100, outerRadius: 250, distance: 120, speed: 1, lineColor: '#ff6b9d', bgColor: '#0a0a0a' }
    },
    {
      name: 'Galaxy Spiral',
      params: { innerRadius: 40, outerRadius: 300, distance: 260, speed: 0.3, lineColor: '#c77dff', bgColor: '#000000' }
    }
  ],
  generateCode: (params, seed) => `
    let t = 0;
    let points = [];
    let maxT = TWO_PI * 10;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      background('${params.bgColor}');
    }

    function draw() {
      if (t > maxT) {
        noLoop();
        return;
      }

      let R = ${params.innerRadius};
      let r = ${params.outerRadius};
      let d = ${params.distance};
      let k = r / R;

      let x = width / 2 + R * ((1 - k) * cos(t) + d * k * cos((1 - k) * t / k));
      let y = height / 2 + R * ((1 - k) * sin(t) - d * k * sin((1 - k) * t / k));

      stroke('${params.lineColor}');
      strokeWeight(1);
      if (t === 0) point(x, y);
      else line(points[points.length - 1].x, points[points.length - 1].y, x, y);

      points.push({ x, y });
      t += 0.05 * ${params.speed};

      if (t % 0.1 < 0.01) {
        stroke('${params.lineColor}');
        strokeWeight(0.2);
        point(x, y);
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      background('${params.bgColor}');
    }
  `
};
