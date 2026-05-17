import { Template } from '../types';

export const fractalTreeTemplate: Template = {
  id: 'fractal-tree',
  name: 'Fractal Tree',
  description: 'A recursive branching tree. Move your mouse to bend it.',
  params: [
    { id: 'depth', name: 'Branch Depth', type: 'number', default: 9, min: 3, max: 14, step: 1 },
    { id: 'angle', name: 'Branch Angle', type: 'number', default: 25, min: 5, max: 60, step: 1 },
    { id: 'trunkLen', name: 'Trunk Length', type: 'number', default: 120, min: 40, max: 250, step: 5 },
    { id: 'lenRatio', name: 'Length Ratio', type: 'number', default: 0.68, min: 0.4, max: 0.85, step: 0.01 },
    { id: 'trunkColor', name: 'Trunk Color', type: 'color', default: '#8B6914' },
    { id: 'leafColor', name: 'Leaf Color', type: 'color', default: '#2ecc71' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0d1117' },
    { id: 'wind', name: 'Mouse Wind', type: 'boolean', default: true },
  ],
  presets: [
    { name: 'Cherry Blossom', params: { depth: 10, angle: 30, trunkLen: 110, lenRatio: 0.72, trunkColor: '#6b3a2a', leafColor: '#ffb7c5', bgColor: '#1a0a14', wind: true } },
    { name: 'Winter Tree', params: { depth: 11, angle: 22, trunkLen: 130, lenRatio: 0.7, trunkColor: '#cccccc', leafColor: '#e8e8e8', bgColor: '#0a0f1e', wind: false } },
    { name: 'Jungle', params: { depth: 8, angle: 40, trunkLen: 100, lenRatio: 0.75, trunkColor: '#2d5a27', leafColor: '#00ff6a', bgColor: '#001208', wind: true } },
  ],
  generateCode: (params, seed) => `
    let windAngle = 0;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      angleMode(DEGREES);
    }

    function draw() {
      background('${params.bgColor}');
      translate(width / 2, height);

      if (${params.wind}) {
        windAngle = map(mouseX, 0, width, -15, 15);
      }

      stroke('${params.trunkColor}');
      strokeWeight(${params.depth * 0.8});
      branch(${params.trunkLen}, ${params.depth});
    }

    function branch(len, depth) {
      let lc = color('${params.trunkColor}');
      let fc = color('${params.leafColor}');
      let t = map(depth, 0, ${params.depth}, 1, 0);
      let c = lerpColor(lc, fc, t);
      stroke(c);
      strokeWeight(max(1, depth * 0.7));

      line(0, 0, 0, -len);
      translate(0, -len);

      if (depth > 0) {
        let a = ${params.angle} + windAngle;
        push();
        rotate(a);
        branch(len * ${params.lenRatio}, depth - 1);
        pop();

        push();
        rotate(-a * 0.8);
        branch(len * ${params.lenRatio} * 0.95, depth - 1);
        pop();
      } else {
        noStroke();
        fill('${params.leafColor}');
        circle(0, 0, 6);
      }
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
