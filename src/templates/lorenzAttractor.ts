import { Template } from '../types';

export const lorenzAttractorTemplate: Template = {
  id: 'lorenz-attractor',
  name: 'Lorenz Attractor',
  description: '3D strange attractor visualization of the Lorenz chaotic system.',
  category: 'physics',
  params: [
    { id: 'sigma', name: 'Sigma', type: 'number', default: 10, min: 1, max: 30, step: 1, category: 'physics', description: 'Prandtl number' },
    { id: 'rho', name: 'Rho', type: 'number', default: 28, min: 1, max: 60, step: 1, category: 'physics', description: 'Rayleigh number' },
    { id: 'beta', name: 'Beta', type: 'number', default: 2.667, min: 0.5, max: 6, step: 0.1, category: 'physics', description: 'Geometric factor' },
    { id: 'speed', name: 'Speed', type: 'number', default: 5, min: 1, max: 20, step: 1, category: 'animation', description: 'Integration speed' },
    { id: 'trailLength', name: 'Trail Length', type: 'number', default: 500, min: 50, max: 2000, step: 50, category: 'animation', description: 'Number of points in trail' },
    { id: 'rotationX', name: 'Rotate X', type: 'number', default: 0.3, min: -1, max: 1, step: 0.05, category: '3d', description: 'View rotation on X axis' },
    { id: 'rotationY', name: 'Rotate Y', type: 'number', default: 0.2, min: -1, max: 1, step: 0.05, category: '3d', description: 'View rotation on Y axis' },
    { id: 'lineColor', name: 'Line Color', type: 'color', default: '#ff6b9d', category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a0a', category: 'color' }
  ],
  presets: [
    { name: 'Classic Butterfly', params: { sigma: 10, rho: 28, beta: 2.667, speed: 5, trailLength: 500 } },
    { name: 'Wild Chaos', params: { sigma: 16, rho: 45.92, beta: 4, speed: 8, trailLength: 800 } },
    { name: 'Slow Motion', params: { sigma: 10, rho: 28, beta: 2.667, speed: 2, trailLength: 1500 } },
  ],
  generateCode: (params, seed) => `
    let x = 0.1, y = 0, z = 0;
    let trail = [];
    let sigma = ${params.sigma};
    let rho = ${params.rho};
    let beta = ${params.beta};
    let dt = 0.01 * ${params.speed};
    let maxTrail = ${params.trailLength};
    let rotX = ${params.rotationX};
    let rotY = ${params.rotationY};
    let lineColor = '${params.lineColor}';
    let bgColor = '${params.bgColor}';
    let scale = 8;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      x = random(-5, 5);
      y = random(-5, 5);
      z = random(-5, 5);
    }

    function draw() {
      background(bgColor);
      translate(width / 2, height / 2);

      // Integration steps per frame
      for (let step = 0; step < 10; step++) {
        let dx = sigma * (y - x);
        let dy = x * (rho - z) - y;
        let dz = x * y - beta * z;
        x += dx * dt;
        y += dy * dt;
        z += dz * dt;

        // 3D rotation
        let rx = x;
        let ry = y * cos(rotX) - z * sin(rotX);
        let rz = y * sin(rotX) + z * cos(rotX);
        let px = rx * cos(rotY) + rz * sin(rotY);
        let py = ry;

        trail.push({ x: px * scale, y: py * scale });
        if (trail.length > maxTrail) trail.shift();
      }

      noFill();
      for (let i = 1; i < trail.length; i++) {
        let alpha = map(i, 0, trail.length, 20, 200);
        let c = color(lineColor);
        stroke(red(c), green(c), blue(c), alpha);
        strokeWeight(1.5);
        line(trail[i - 1].x, trail[i - 1].y, trail[i].x, trail[i].y);
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `,
};
