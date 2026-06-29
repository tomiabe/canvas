import { Template } from '../types';

export const worleyNoiseTemplate: Template = {
  id: 'worley-noise',
  name: 'Worley Noise',
  description: 'Cellular noise texture based on distance to random feature points.',
  category: 'noise',
  params: [
    { id: 'points', name: 'Feature Points', type: 'number', default: 30, min: 5, max: 100, step: 5, category: 'noise', description: 'Number of random feature points' },
    { id: 'scale', name: 'Cell Scale', type: 'number', default: 80, min: 20, max: 200, step: 10, category: 'layout', suffix: 'px', description: 'Scale of noise features' },
    { id: 'distance', name: 'Distance Metric', type: 'enum', default: 'euclidean', options: ['euclidean', 'manhattan', 'chebyshev'], category: 'noise', description: 'Distance calculation method' },
    { id: 'colorMode', name: 'Color Mode', type: 'enum', default: 'gradient', options: ['gradient', 'cells', 'rings', 'crackle'], category: 'color' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#0a0a2e', '#1a1a4e', '#3a3a8e', '#6a6abe', '#9a9ade'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000', category: 'color' }
  ],
  presets: [
    {
      name: 'Cellular',
      params: { points: 20, scale: 100, distance: 'euclidean', colorMode: 'cells', palette: ['#000000', '#1a1a4e', '#3a3a8e', '#6a6abe'], bgColor: '#000000' }
    },
    {
      name: 'Water Caustics',
      params: { points: 50, scale: 50, distance: 'manhattan', colorMode: 'rings', palette: ['#00b4d8', '#90e0ef', '#caf0f8', '#ffffff'], bgColor: '#03045e' }
    }
  ],
  generateCode: (params, seed) => `
    let featurePoints = [];
    let palette = ${JSON.stringify(params.palette)};
    let scale = ${params.scale};
    let distMode = '${params.distance}';
    let colorMode = '${params.colorMode}';

    function setup() {
      createCanvas(windowWidth, windowHeight);
      pixelDensity(1);
      randomSeed(${seed});
      let count = ${params.points};
      for (let i = 0; i < count; i++) {
        featurePoints.push({ x: random(width), y: random(height) });
      }
    }

    function draw() {
      loadPixels();

      for (let x = 0; x < width; x += 2) {
        for (let y = 0; y < height; y += 2) {
          let minDist = Infinity;
          let secondMin = Infinity;

          for (let p of featurePoints) {
            let dx = (x - p.x) / scale;
            let dy = (y - p.y) / scale;
            let d;
            if (distMode === 'euclidean') d = sqrt(dx * dx + dy * dy);
            else if (distMode === 'manhattan') d = abs(dx) + abs(dy);
            else d = max(abs(dx), abs(dy));

            if (d < minDist) { secondMin = minDist; minDist = d; }
            else if (d < secondMin) secondMin = d;
          }

          let val;
          if (colorMode === 'gradient') val = minDist;
          else if (colorMode === 'cells') val = floor(minDist * 5) / 5;
          else if (colorMode === 'rings') val = minDist - floor(minDist);
          else val = secondMin - minDist;

          val = constrain(val, 0, 1);
          let pLen = palette.length;
          let idx1 = floor(val * (pLen - 1));
          let idx2 = min(idx1 + 1, pLen - 1);
          let localT = (val * (pLen - 1)) - idx1;
          let c1 = color(palette[idx1]);
          let c2 = color(palette[idx2]);
          let col = lerpColor(c1, c2, localT);

          for (let px = 0; px < 2; px++) {
            for (let py = 0; py < 2; py++) {
              let idx = ((x + px) + (y + py) * width) * 4;
              if (idx < pixels.length) {
                pixels[idx] = red(col);
                pixels[idx + 1] = green(col);
                pixels[idx + 2] = blue(col);
                pixels[idx + 3] = 255;
              }
            }
          }
        }
      }
      updatePixels();
      noLoop();
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
