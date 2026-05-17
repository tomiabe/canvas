import { Template } from '../types';

export const roseCurvesTemplate: Template = {
  id: 'rose-curves',
  name: 'Rose Curves',
  description: 'Rhodonea curves — petal-shaped mathematical flowers.',
  params: [
    { id: 'k', name: 'Petal Factor (k)', type: 'number', default: 5, min: 1, max: 12, step: 1 },
    { id: 'layers', name: 'Layers', type: 'number', default: 4, min: 1, max: 12, step: 1 },
    { id: 'speed', name: 'Anim Speed', type: 'number', default: 0.008, min: 0, max: 0.04, step: 0.001 },
    { id: 'palette', name: 'Colors', type: 'color-array', default: ['#ff006e', '#ff4d94', '#ff99c8', '#ffd6e8'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000' },
    { id: 'filled', name: 'Filled Petals', type: 'boolean', default: false },
    { id: 'rotate', name: 'Rotate', type: 'boolean', default: true },
  ],
  presets: [
    { name: 'Pink Rose', params: { k: 5, layers: 6, speed: 0.006, palette: ['#ff1493','#ff69b4','#ffb6c1','#ffe4e1'], bgColor: '#0d0008', filled: true, rotate: true } },
    { name: 'Golden Bloom', params: { k: 7, layers: 5, speed: 0.005, palette: ['#ffd700','#ffa500','#ff6347'], bgColor: '#0a0500', filled: false, rotate: true } },
    { name: 'Mandala', params: { k: 8, layers: 8, speed: 0.003, palette: ['#00bfff','#1e90ff','#4169e1','#8a2be2'], bgColor: '#000011', filled: true, rotate: false } },
  ],
  generateCode: (params, seed) => `
    let t = 0;
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      colorMode(RGB, 255, 255, 255, 255);
    }

    function draw() {
      background(0, 0, 0, 15);
      translate(width/2, height/2);
      let r = min(width, height) * 0.44;
      let k = ${params.k};
      let layers = ${params.layers};

      for (let l = 0; l < layers; l++) {
        let lr = r * (1 - l * 0.08);
        let col = color(palette[l % palette.length]);
        let offset = ${params.rotate} ? t + l * (PI / layers) : l * (PI / layers);

        if (${params.filled}) {
          fill(red(col), green(col), blue(col), 40);
          noStroke();
        } else {
          stroke(red(col), green(col), blue(col), 180);
          strokeWeight(1.5);
          noFill();
        }

        beginShape();
        for (let a = 0; a <= TWO_PI * (k % 2 === 0 ? 2 : 1) + 0.01; a += 0.01) {
          let rr = lr * cos(k * (a + offset));
          vertex(rr * cos(a), rr * sin(a));
        }
        endShape(CLOSE);
      }

      t += ${params.speed};
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
