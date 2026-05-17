import { Template } from '../types';

export const spirographTemplate: Template = {
  id: 'spirograph',
  name: 'Spirograph',
  description: 'Hypotrochoid and epitrochoid curves like the classic toy.',
  params: [
    { id: 'R', name: 'Outer Radius', type: 'number', default: 180, min: 50, max: 300, step: 5 },
    { id: 'r', name: 'Inner Radius', type: 'number', default: 80, min: 10, max: 200, step: 1 },
    { id: 'd', name: 'Pen Distance', type: 'number', default: 100, min: 10, max: 250, step: 1 },
    { id: 'speed', name: 'Draw Speed', type: 'number', default: 3, min: 1, max: 20, step: 1 },
    { id: 'palette', name: 'Colors', type: 'color-array', default: ['#ff006e', '#ff7f00', '#ffff00', '#00ff7f', '#007fff', '#7f00ff'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a0a' },
    { id: 'animated', name: 'Animate', type: 'boolean', default: true },
  ],
  presets: [
    { name: 'Rose', params: { R: 200, r: 40, d: 120, speed: 5, palette: ['#ff1493', '#ff69b4', '#ffb6c1'], bgColor: '#0d0008', animated: true } },
    { name: 'Star', params: { R: 180, r: 120, d: 80, speed: 3, palette: ['#ffd700', '#ff8c00'], bgColor: '#000000', animated: true } },
    { name: 'Galaxy', params: { R: 160, r: 70, d: 160, speed: 2, palette: ['#00bfff', '#9370db', '#00ced1'], bgColor: '#000011', animated: true } },
  ],
  generateCode: (params, seed) => `
    let t = 0;
    let colorIdx = 0;
    let palette = ${JSON.stringify(params.palette)};
    let prevX, prevY;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      background('${params.bgColor}');
      let pos = getPos(0);
      prevX = pos.x;
      prevY = pos.y;
    }

    function getPos(angle) {
      let R = ${params.R}, r = ${params.r}, d = ${params.d};
      let x = width/2 + (R - r) * cos(angle) + d * cos((R - r) / r * angle);
      let y = height/2 + (R - r) * sin(angle) - d * sin((R - r) / r * angle);
      return { x, y };
    }

    function draw() {
      if (!${params.animated} && t > TWO_PI * ${params.r}) return;

      for (let i = 0; i < ${params.speed}; i++) {
        let pos = getPos(t);
        colorIdx = floor(map(t % TWO_PI, 0, TWO_PI, 0, palette.length));
        stroke(palette[colorIdx % palette.length]);
        strokeWeight(1.5);
        line(prevX, prevY, pos.x, pos.y);
        prevX = pos.x;
        prevY = pos.y;
        t += 0.02;
      }

      if (t > TWO_PI * lcm(${params.R}, ${params.r}) / ${params.r}) {
        t = 0;
        background('${params.bgColor}');
        let pos = getPos(0);
        prevX = pos.x;
        prevY = pos.y;
      }
    }

    function lcm(a, b) { return abs(a * b) / gcd(a, b); }
    function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
    function windowResized() { resizeCanvas(windowWidth, windowHeight); background('${params.bgColor}'); }
  `,
};
