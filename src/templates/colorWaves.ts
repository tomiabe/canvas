import { Template } from '../types';

export const colorWavesTemplate: Template = {
  id: 'color-waves',
  name: 'Color Waves',
  description: 'Animated flowing color gradients using sine waves and color interpolation.',
  category: 'color',
  params: [
    { id: 'speed', name: 'Wave Speed', type: 'number', default: 0.02, min: 0.001, max: 0.1, step: 0.002, category: 'animation', description: 'Animation speed' },
    { id: 'complexity', name: 'Wave Complexity', type: 'number', default: 3, min: 1, max: 8, step: 1, category: 'animation', description: 'Number of overlapping wave layers' },
    { id: 'density', name: 'Stripe Density', type: 'number', default: 0.01, min: 0.002, max: 0.05, step: 0.002, category: 'layout', description: 'Frequency of the waves' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff0054', '#ff6b9d', '#c77dff', '#00b4d8', '#00e5ff'], category: 'color', description: 'Colors blended across the waves' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000', category: 'color' }
  ],
  presets: [
    {
      name: 'Aurora Borealis',
      params: { speed: 0.01, complexity: 5, density: 0.008, palette: ['#00ff87', '#60efff', '#0066ff', '#a020f0', '#ff0099'], bgColor: '#000000' }
    },
    {
      name: 'Sunset',
      params: { speed: 0.005, complexity: 3, density: 0.015, palette: ['#ff4500', '#ff6347', '#ff8c00', '#ffd700', '#ff69b4'], bgColor: '#1a0000' }
    }
  ],
  generateCode: (params, seed) => `
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      pixelDensity(1);
    }

    function draw() {
      loadPixels();

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          let blendVal = 0;
          let c = ${params.complexity};
          for (let i = 0; i < c; i++) {
            blendVal += sin(x * ${params.density} * (i + 1) + y * ${params.density} * (i + 1) + frameCount * ${params.speed} * (i + 1));
          }
          blendVal = blendVal / c;
          blendVal = map(blendVal, -1, 1, 0, 1);

          let pLen = palette.length;
          let seg = 1.0 / (pLen - 1);
          let idx1 = floor(blendVal / seg);
          let idx2 = min(idx1 + 1, pLen - 1);
          let localT = (blendVal - idx1 * seg) / seg;

          let c1 = color(palette[idx1]);
          let c2 = color(palette[idx2]);
          let col = lerpColor(c1, c2, localT);

          let idx = (x + y * width) * 4;
          pixels[idx] = red(col);
          pixels[idx + 1] = green(col);
          pixels[idx + 2] = blue(col);
          pixels[idx + 3] = 255;
        }
      }
      updatePixels();
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
