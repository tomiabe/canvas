import { Template } from '../types';

export const ribbonsTemplate: Template = {
  id: 'ribbons',
  name: 'Flowing Ribbons',
  description: 'Silky ribbons of color weaving through noise-driven space.',
  params: [
    { id: 'count', name: 'Ribbon Count', type: 'number', default: 12, min: 3, max: 40, step: 1 },
    { id: 'width', name: 'Ribbon Width', type: 'number', default: 15, min: 3, max: 60, step: 1 },
    { id: 'speed', name: 'Flow Speed', type: 'number', default: 0.005, min: 0.001, max: 0.02, step: 0.001 },
    { id: 'palette', name: 'Colors', type: 'color-array', default: ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0', '#ffbe0b'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000' },
    { id: 'opacity', name: 'Ribbon Opacity', type: 'number', default: 120, min: 20, max: 255, step: 5 },
    { id: 'blur', name: 'Soft Edges', type: 'boolean', default: true },
  ],
  presets: [
    { name: 'Silk', params: { count: 15, width: 20, speed: 0.004, palette: ['#ff88cc','#cc88ff','#88ccff','#88ffcc'], bgColor: '#000000', opacity: 100, blur: true } },
    { name: 'Electric', params: { count: 8, width: 8, speed: 0.01, palette: ['#00ffff','#ff00ff','#ffff00'], bgColor: '#000000', opacity: 160, blur: false } },
    { name: 'Aurora', params: { count: 20, width: 25, speed: 0.003, palette: ['#00ff88','#00ccff','#aa00ff'], bgColor: '#000814', opacity: 80, blur: true } },
  ],
  generateCode: (params, seed) => `
    let ribbons = [];
    let palette = ${JSON.stringify(params.palette)};
    let t = 0;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      noiseSeed(${seed});
      colorMode(RGB, 255, 255, 255, 255);
      initRibbons();
    }

    function initRibbons() {
      ribbons = [];
      for (let i = 0; i < ${params.count}; i++) {
        ribbons.push({
          x: random(width),
          y: random(height),
          col: palette[i % palette.length],
          offset: random(1000),
          history: [],
        });
      }
    }

    function draw() {
      background(0, 0, 0, 10);
      noStroke();

      for (let r of ribbons) {
        let angle = noise(r.x * 0.003, r.y * 0.003, t) * TWO_PI * 2;
        r.x += cos(angle) * 2;
        r.y += sin(angle) * 2;

        if (r.x < 0) r.x = width;
        if (r.x > width) r.x = 0;
        if (r.y < 0) r.y = height;
        if (r.y > height) r.y = 0;

        r.history.push({ x: r.x, y: r.y });
        if (r.history.length > 80) r.history.shift();

        let col = color(r.col);
        for (let i = 1; i < r.history.length; i++) {
          let a = map(i, 0, r.history.length, 0, ${params.opacity});
          let w = map(i, 0, r.history.length, 0, ${params.width});

          if (${params.blur}) {
            fill(red(col), green(col), blue(col), a * 0.3);
            ellipse(r.history[i].x, r.history[i].y, w * 2.5, w * 2.5);
          }
          fill(red(col), green(col), blue(col), a);
          ellipse(r.history[i].x, r.history[i].y, w, w);
        }
      }

      t += ${params.speed};
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); initRibbons(); }
  `,
};
