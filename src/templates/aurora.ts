import { Template } from '../types';

export const auroraTemplate: Template = {
  id: 'aurora',
  name: 'Aurora Borealis',
  description: 'Flowing northern lights with layered Perlin noise curtains.',
  params: [
    { id: 'layers', name: 'Light Layers', type: 'number', default: 6, min: 2, max: 12, step: 1 },
    { id: 'speed', name: 'Flow Speed', type: 'number', default: 0.003, min: 0.001, max: 0.015, step: 0.001 },
    { id: 'palette', name: 'Aurora Colors', type: 'color-array', default: ['#00ff88', '#00ccff', '#aa00ff', '#ff00aa'] },
    { id: 'bgColor', name: 'Sky Color', type: 'color', default: '#000814' },
    { id: 'stars', name: 'Show Stars', type: 'boolean', default: true },
    { id: 'brightness', name: 'Brightness', type: 'number', default: 120, min: 30, max: 200, step: 5 },
  ],
  presets: [
    { name: 'Green Dream', params: { layers: 7, speed: 0.004, palette: ['#00ff66', '#00ffcc', '#66ff00'], bgColor: '#000510', stars: true, brightness: 140 } },
    { name: 'Violet Storm', params: { layers: 9, speed: 0.007, palette: ['#cc00ff', '#ff00cc', '#6600ff', '#0044ff'], bgColor: '#05000d', stars: true, brightness: 160 } },
    { name: 'Arctic Fire', params: { layers: 5, speed: 0.002, palette: ['#00ffff', '#0080ff', '#ff4400'], bgColor: '#000a1a', stars: false, brightness: 100 } },
  ],
  generateCode: (params, seed) => `
    let t = 0;
    let stars = [];
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      noiseSeed(${seed});
      colorMode(RGB, 255, 255, 255, 255);

      if (${params.stars}) {
        for (let i = 0; i < 200; i++) {
          stars.push({ x: random(width), y: random(height * 0.6), b: random(50, 200) });
        }
      }
    }

    function draw() {
      background('${params.bgColor}');

      if (${params.stars}) {
        noStroke();
        for (let s of stars) {
          let flicker = s.b + sin(t * 0.05 + s.x) * 30;
          fill(255, 255, 255, flicker);
          circle(s.x, s.y, random() < 0.001 ? 3 : 1.5);
        }
      }

      let layers = ${params.layers};
      for (let l = 0; l < layers; l++) {
        let col = color(palette[l % palette.length]);
        let yBase = map(l, 0, layers - 1, height * 0.1, height * 0.7);
        let alpha = ${params.brightness} * (1 - l / layers * 0.5);

        beginShape();
        noStroke();
        for (let x = 0; x <= width + 10; x += 5) {
          let n = noise(x * 0.003 + l * 3, t + l * 0.5);
          let y = yBase + map(n, 0, 1, -80, 80);
          let a = alpha * noise(x * 0.005 + l * 2, t * 0.5 + l);
          fill(red(col), green(col), blue(col), a);
          vertex(x, y);
          vertex(x, y + map(n, 0, 1, 40, 120));
        }
        endShape(CLOSE);
      }

      t += ${params.speed} * 60;
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
