import { Template } from '../types';

export const attractorsTemplate: Template = {
  id: 'attractors',
  name: 'Strange Attractors',
  description: 'Lorenz and other chaotic attractors — beautiful chaos theory visualized.',
  params: [
    { id: 'type', name: 'Attractor Type', type: 'enum', default: 'lorenz', options: ['lorenz', 'rossler', 'thomas', 'dadras'] },
    { id: 'speed', name: 'Simulation Speed', type: 'number', default: 5, min: 1, max: 20, step: 1 },
    { id: 'trailLen', name: 'Trail Length', type: 'number', default: 2000, min: 200, max: 8000, step: 200 },
    { id: 'palette', name: 'Colors', type: 'color-array', default: ['#ff00cc', '#cc00ff', '#6600ff', '#0066ff', '#00ccff'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000' },
    { id: 'scale', name: 'Scale', type: 'number', default: 8, min: 2, max: 20, step: 1 },
    { id: 'thickness', name: 'Line Weight', type: 'number', default: 1, min: 0.3, max: 3, step: 0.1 },
  ],
  presets: [
    { name: 'Lorenz Butterfly', params: { type: 'lorenz', speed: 8, trailLen: 3000, palette: ['#ff00cc','#8800ff','#0066ff'], bgColor: '#000000', scale: 8, thickness: 0.8 } },
    { name: 'Rössler Flow', params: { type: 'rossler', speed: 5, trailLen: 2000, palette: ['#00ffcc','#0099ff'], bgColor: '#000a08', scale: 15, thickness: 1 } },
    { name: 'Thomas Chaos', params: { type: 'thomas', speed: 3, trailLen: 4000, palette: ['#ffcc00','#ff6600','#ff0000'], bgColor: '#050200', scale: 60, thickness: 0.6 } },
  ],
  generateCode: (params, seed) => `
    let x, y, z, trail = [];
    let palette = ${JSON.stringify(params.palette)};
    let dt = 0.005;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      x = random(-1, 1); y = random(-1, 1); z = random(10, 20);
      colorMode(RGB, 255, 255, 255, 255);
    }

    function step() {
      let dx, dy, dz;
      let type = '${params.type}';
      if (type === 'lorenz') {
        let sigma = 10, rho = 28, beta = 8/3;
        dx = sigma * (y - x); dy = x * (rho - z) - y; dz = x*y - beta*z;
      } else if (type === 'rossler') {
        let a = 0.2, b = 0.2, c = 5.7;
        dx = -y - z; dy = x + a*y; dz = b + z*(x - c);
      } else if (type === 'thomas') {
        let b = 0.19;
        dx = sin(y) - b*x; dy = sin(z) - b*y; dz = sin(x) - b*z;
      } else {
        // dadras
        dx = y - 3*x + 2.7*y*z; dy = 1.7*y - x*z + z; dz = x*y - 3.3*z;
      }
      x += dx * dt; y += dy * dt; z += dz * dt;
    }

    function project(px, py, pz) {
      let s = ${params.scale};
      return { x: px * s + width/2, y: -pz * s + height * 0.6 };
    }

    function draw() {
      background(0, 0, 0, 15);

      for (let i = 0; i < ${params.speed}; i++) {
        step();
        trail.push({ x, y, z });
        if (trail.length > ${params.trailLen}) trail.shift();
      }

      for (let i = 1; i < trail.length; i++) {
        let a = map(i, 0, trail.length, 0, 255);
        let cidx = floor(map(i, 0, trail.length, 0, palette.length));
        let col = color(palette[min(cidx, palette.length-1)]);
        stroke(red(col), green(col), blue(col), a);
        strokeWeight(${params.thickness});
        let p1 = project(trail[i-1].x, trail[i-1].y, trail[i-1].z);
        let p2 = project(trail[i].x, trail[i].y, trail[i].z);
        line(p1.x, p1.y, p2.x, p2.y);
      }
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
