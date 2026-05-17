import { Template } from '../types';

export const fourierEpicyclesTemplate: Template = {
  id: 'fourier-epicycles',
  name: 'Fourier Epicycles',
  description: 'Rotating circles within circles tracing complex shapes — Fourier in motion.',
  params: [
    { id: 'numCycles', name: 'Cycle Count', type: 'number', default: 12, min: 3, max: 40, step: 1 },
    { id: 'speed', name: 'Rotation Speed', type: 'number', default: 0.5, min: 0.1, max: 3, step: 0.1 },
    { id: 'pattern', name: 'Draw Pattern', type: 'enum', default: 'circle', options: ['circle', 'square', 'star', 'heart', 'infinity'] },
    { id: 'armColor', name: 'Arm Color', type: 'color', default: '#334455' },
    { id: 'traceColor', name: 'Trace Color', type: 'color', default: '#00ffcc' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000' },
    { id: 'showCircles', name: 'Show Circles', type: 'boolean', default: true },
  ],
  presets: [
    { name: 'Circle Dance', params: { numCycles: 15, speed: 0.6, pattern: 'circle', armColor: '#223344', traceColor: '#00ffcc', bgColor: '#000000', showCircles: true } },
    { name: 'Star Tracer', params: { numCycles: 20, speed: 0.4, pattern: 'star', armColor: '#2a1a2a', traceColor: '#ff00cc', bgColor: '#050005', showCircles: true } },
    { name: 'Minimal', params: { numCycles: 8, speed: 1, pattern: 'infinity', armColor: '#111111', traceColor: '#ffffff', bgColor: '#000000', showCircles: false } },
  ],
  generateCode: (params, seed) => `
    let path = [], epicycles = [], t = 0;
    let dt;

    function getPatternPoints(type, n) {
      let pts = [];
      for (let i = 0; i < n; i++) {
        let a = map(i, 0, n, 0, TWO_PI);
        let x, y, r = 150;
        if (type === 'circle') {
          x = r * cos(a); y = r * sin(a);
        } else if (type === 'square') {
          let t2 = (a / TWO_PI) * 4;
          let s = t2 % 1;
          if (floor(t2) === 0) { x = -r + s*2*r; y = -r; }
          else if (floor(t2) === 1) { x = r; y = -r + s*2*r; }
          else if (floor(t2) === 2) { x = r - s*2*r; y = r; }
          else { x = -r; y = r - s*2*r; }
        } else if (type === 'star') {
          let ri = i % 2 === 0 ? r : r * 0.4;
          x = ri * cos(a); y = ri * sin(a);
        } else if (type === 'heart') {
          x = r * 0.8 * 16 * pow(sin(a), 3) / 16;
          y = -r * 0.8 * (13*cos(a) - 5*cos(2*a) - 2*cos(3*a) - cos(4*a)) / 16;
        } else {
          x = r * cos(a); y = r * sin(2*a) * 0.7;
        }
        pts.push({ x, y });
      }
      return pts;
    }

    function dft(pts) {
      let N = pts.length, cycles = [];
      for (let k = 0; k < N; k++) {
        let re = 0, im = 0;
        for (let n = 0; n < N; n++) {
          let phi = (TWO_PI * k * n) / N;
          re += pts[n].x * cos(phi) + pts[n].y * sin(phi);
          im += -pts[n].x * sin(phi) + pts[n].y * cos(phi);
        }
        re /= N; im /= N;
        cycles.push({ amp: sqrt(re*re + im*im), phase: atan2(im, re), freq: k });
      }
      return cycles.sort((a, b) => b.amp - a.amp);
    }

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      let pts = getPatternPoints('${params.pattern}', 64);
      epicycles = dft(pts).slice(0, ${params.numCycles});
      dt = TWO_PI / 64;
    }

    function draw() {
      background('${params.bgColor}');
      translate(width/2, height/2);

      let x = 0, y = 0;
      for (let cycle of epicycles) {
        let px = x, py = y;
        let angle = cycle.freq * t + cycle.phase;
        x += cycle.amp * cos(angle);
        y += cycle.amp * sin(angle);

        if (${params.showCircles}) {
          stroke('${params.armColor}');
          strokeWeight(1);
          noFill();
          circle(px, py, cycle.amp * 2);
          stroke(100, 100, 100, 150);
          line(px, py, x, y);
        }
      }

      path.unshift({ x, y });
      if (path.length > 512) path.pop();

      noFill();
      stroke('${params.traceColor}');
      strokeWeight(2);
      beginShape();
      for (let p of path) vertex(p.x, p.y);
      endShape();

      // Draw point at tip
      noStroke();
      fill('${params.traceColor}');
      circle(x, y, 5);

      t += dt * ${params.speed};
      if (t > TWO_PI) { t = 0; path = []; }
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
