import { Template } from '../types';

export const dotMatrixTemplate: Template = {
  id: 'dot-matrix',
  name: 'Dot Matrix',
  description: 'A grid of dots pulsing and morphing driven by Perlin noise.',
  params: [
    { id: 'spacing', name: 'Dot Spacing', type: 'number', default: 25, min: 10, max: 60, step: 5 },
    { id: 'maxSize', name: 'Max Dot Size', type: 'number', default: 18, min: 3, max: 40, step: 1 },
    { id: 'noiseScale', name: 'Pattern Scale', type: 'number', default: 0.05, min: 0.01, max: 0.15, step: 0.005 },
    { id: 'speed', name: 'Animation Speed', type: 'number', default: 0.01, min: 0, max: 0.05, step: 0.002 },
    { id: 'palette', name: 'Colors', type: 'color-array', default: ['#00ffcc', '#0088ff', '#ff00cc'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000' },
    { id: 'shape', name: 'Dot Shape', type: 'enum', default: 'circle', options: ['circle', 'square', 'diamond'] },
  ],
  presets: [
    { name: 'Pulse', params: { spacing: 25, maxSize: 20, noiseScale: 0.04, speed: 0.012, palette: ['#ffffff','#aaaaaa'], bgColor: '#000000', shape: 'circle' } },
    { name: 'Rainbow Grid', params: { spacing: 20, maxSize: 14, noiseScale: 0.06, speed: 0.008, palette: ['#ff0000','#ff8800','#ffff00','#00ff00','#0000ff','#ff00ff'], bgColor: '#000000', shape: 'circle' } },
    { name: 'Pixels', params: { spacing: 15, maxSize: 12, noiseScale: 0.035, speed: 0.015, palette: ['#00ff44','#00cc33'], bgColor: '#000a02', shape: 'square' } },
  ],
  generateCode: (params, seed) => `
    let t = 0;
    let palette = ${JSON.stringify(params.palette)};
    let sp = ${params.spacing};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      noiseSeed(${seed});
      colorMode(RGB, 255, 255, 255, 255);
    }

    function draw() {
      background('${params.bgColor}');
      noStroke();

      for (let x = sp/2; x < width + sp; x += sp) {
        for (let y = sp/2; y < height + sp; y += sp) {
          let n = noise(x * ${params.noiseScale}, y * ${params.noiseScale}, t);
          let sz = n * ${params.maxSize};
          let colIdx = floor(n * palette.length);
          let col = color(palette[colIdx % palette.length]);
          let alpha = map(n, 0, 1, 40, 255);
          fill(red(col), green(col), blue(col), alpha);

          let shape = '${params.shape}';
          if (shape === 'circle') {
            circle(x, y, sz);
          } else if (shape === 'square') {
            rectMode(CENTER);
            rect(x, y, sz, sz);
          } else {
            // diamond
            push();
            translate(x, y);
            rotate(PI / 4);
            rectMode(CENTER);
            rect(0, 0, sz * 0.8, sz * 0.8);
            pop();
          }
        }
      }

      t += ${params.speed};
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
