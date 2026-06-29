import { Template } from '../types';

export const doublePendulumTemplate: Template = {
  id: 'double-pendulum',
  name: 'Double Pendulum',
  description: 'Chaotic motion of a double pendulum with trail visualization.',
  category: 'physics',
  params: [
    { id: 'length1', name: 'Arm 1 Length', type: 'number', default: 120, min: 40, max: 250, step: 10, category: 'physics', suffix: 'px', description: 'Length of first pendulum arm' },
    { id: 'length2', name: 'Arm 2 Length', type: 'number', default: 120, min: 40, max: 250, step: 10, category: 'physics', suffix: 'px', description: 'Length of second pendulum arm' },
    { id: 'mass1', name: 'Mass 1', type: 'number', default: 10, min: 2, max: 30, step: 1, category: 'physics', description: 'Mass of first bob' },
    { id: 'mass2', name: 'Mass 2', type: 'number', default: 10, min: 2, max: 30, step: 1, category: 'physics', description: 'Mass of second bob' },
    { id: 'gravity', name: 'Gravity', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1, category: 'physics', description: ' gravitational force' },
    { id: 'trailLength', name: 'Trail Length', type: 'number', default: 300, min: 10, max: 1000, step: 10, category: 'animation', description: 'Length of the motion trail' },
    { id: 'trailColor', name: 'Trail Color', type: 'color', default: '#00e5ff', category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#050510', category: 'color' }
  ],
  presets: [
    {
      name: 'Chaos Butterfly',
      params: { length1: 150, length2: 100, mass1: 15, mass2: 5, gravity: 1, trailLength: 500, trailColor: '#ff6b9d', bgColor: '#0a0a0a' }
    },
    {
      name: 'Gentle Swing',
      params: { length1: 200, length2: 200, mass1: 20, mass2: 20, gravity: 0.5, trailLength: 200, trailColor: '#00b4d8', bgColor: '#050510' }
    }
  ],
  generateCode: (params, seed) => `
    let r1 = ${params.length1};
    let r2 = ${params.length2};
    let m1 = ${params.mass1};
    let m2 = ${params.mass2};
    let g = ${params.gravity};
    let a1 = PI / 2;
    let a2 = PI / 2;
    let a1_v = 0;
    let a2_v = 0;
    let trail = [];

    function setup() {
      createCanvas(windowWidth, windowHeight);
      a1 = random(TWO_PI);
      a2 = random(TWO_PI);
      background('${params.bgColor}');
    }

    function draw() {
      background('${params.bgColor}');

      let num1 = -g * (2 * m1 + m2) * sin(a1);
      let num2 = -m2 * g * sin(a1 - 2 * a2);
      let num3 = -2 * sin(a1 - a2) * m2;
      let num4 = a2_v * a2_v * r2 + a1_v * a1_v * r1 * cos(a1 - a2);
      let den = r1 * (2 * m1 + m2 - m2 * cos(2 * a1 - 2 * a2));
      let a1_a = (num1 + num2 + num3 * num4) / den;

      num1 = 2 * sin(a1 - a2);
      num2 = (a1_v * a1_v * r1 * (m1 + m2));
      num3 = g * (m1 + m2) * cos(a1);
      num4 = a2_v * a2_v * r2 * m2 * cos(a1 - a2);
      den = r2 * (2 * m1 + m2 - m2 * cos(2 * a1 - 2 * a2));
      let a2_a = (num1 * (num2 + num3 + num4)) / den;

      let cx = width / 2;
      let cy = height / 2 + 50;

      let x1 = cx + r1 * sin(a1);
      let y1 = cy + r1 * cos(a1);
      let x2 = x1 + r2 * sin(a2);
      let y2 = y1 + r2 * cos(a2);

      a1_v += a1_a;
      a2_v += a2_a;
      a1 += a1_v;
      a2 += a2_v;

      trail.push({ x: x2, y: y2 });
      if (trail.length > ${params.trailLength}) trail.shift();

      // Draw trail
      noFill();
      for (let i = 1; i < trail.length; i++) {
        let alpha = map(i, 0, trail.length, 0, 200);
        stroke(red('${params.trailColor}'), green('${params.trailColor}'), blue('${params.trailColor}'), alpha);
        strokeWeight(1.5);
        line(trail[i - 1].x, trail[i - 1].y, trail[i].x, trail[i].y);
      }

      // Draw arms
      stroke(255, 100);
      strokeWeight(2);
      line(cx, cy, x1, y1);
      line(x1, y1, x2, y2);

      // Draw bobs
      noStroke();
      fill(255);
      circle(x1, y1, m1 * 2);
      fill(255, 200);
      circle(x2, y2, m2 * 2);
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
