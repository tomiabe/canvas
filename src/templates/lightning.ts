import { Template } from '../types';

export const lightningTemplate: Template = {
  id: 'lightning',
  name: 'Lightning Bolts',
  description: 'Fractal lightning branching across the screen. Click to strike.',
  params: [
    { id: 'branches', name: 'Branch Count', type: 'number', default: 3, min: 1, max: 8, step: 1 },
    { id: 'depth', name: 'Branch Depth', type: 'number', default: 5, min: 2, max: 9, step: 1 },
    { id: 'spread', name: 'Spread', type: 'number', default: 30, min: 5, max: 80, step: 5 },
    { id: 'boltColor', name: 'Bolt Color', type: 'color', default: '#aaccff' },
    { id: 'glowColor', name: 'Glow Color', type: 'color', default: '#4488ff' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000011' },
    { id: 'speed', name: 'Strike Rate', type: 'number', default: 30, min: 5, max: 120, step: 5 },
    { id: 'fade', name: 'Fade Speed', type: 'number', default: 15, min: 3, max: 50, step: 1 },
  ],
  presets: [
    { name: 'Thunderstorm', params: { branches: 4, depth: 6, spread: 35, boltColor: '#ffffff', glowColor: '#8888ff', bgColor: '#000022', speed: 40, fade: 12 } },
    { name: 'Plasma', params: { branches: 5, depth: 7, spread: 25, boltColor: '#ff00ff', glowColor: '#ff44ff', bgColor: '#0a000a', speed: 25, fade: 20 } },
    { name: 'Tesla', params: { branches: 3, depth: 8, spread: 20, boltColor: '#00ffff', glowColor: '#0088ff', bgColor: '#000000', speed: 60, fade: 8 } },
  ],
  generateCode: (params, seed) => `
    let bolts = [];
    let counter = 0;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      colorMode(RGB, 255, 255, 255, 255);
    }

    function strike(sx, sy) {
      let segs = [];
      let targets = [];
      for (let b = 0; b < ${params.branches}; b++) {
        let angle = radians(-90 + random(-30, 30));
        generateBolt(sx, sy, angle, height * 0.7, ${params.depth}, segs);
      }
      bolts.push({ segs, alpha: 255 });
    }

    function generateBolt(x, y, angle, len, depth, segs) {
      if (depth <= 0 || len < 5) return;
      let ex = x + cos(angle) * len;
      let ey = y + sin(angle) * len;
      segs.push({ x1: x, y1: y, x2: ex, y2: ey, depth });
      generateBolt(ex, ey, angle + radians(random(-${params.spread}, ${params.spread})), len * 0.6, depth - 1, segs);
      if (random() < 0.4) {
        generateBolt(ex, ey, angle + radians(random(15, 45) * (random() < 0.5 ? 1 : -1)), len * 0.4, depth - 2, segs);
      }
    }

    function draw() {
      background('${params.bgColor}');
      counter++;
      if (counter % floor(60 / (${params.speed} / 10)) === 0) {
        strike(random(width * 0.2, width * 0.8), 0);
      }

      for (let i = bolts.length - 1; i >= 0; i--) {
        let bolt = bolts[i];
        for (let seg of bolt.segs) {
          let w = map(seg.depth, 0, ${params.depth}, 0.3, 3);
          let gc = color('${params.glowColor}');
          for (let g = 3; g >= 0; g--) {
            stroke(red(gc), green(gc), blue(gc), bolt.alpha * 0.15);
            strokeWeight(w + g * 2.5);
            line(seg.x1, seg.y1, seg.x2, seg.y2);
          }
          stroke(color('${params.boltColor}'));
          strokeWeight(w);
          line(seg.x1, seg.y1, seg.x2, seg.y2);
        }
        bolt.alpha -= ${params.fade};
        if (bolt.alpha <= 0) bolts.splice(i, 1);
      }
    }

    function mousePressed() { strike(mouseX, mouseY - 10); }
    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
