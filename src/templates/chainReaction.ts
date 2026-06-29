import { Template } from '../types';

export const chainReactionTemplate: Template = {
  id: 'chain-reaction',
  name: 'Chain Reaction',
  description: 'Abelian sandpile model — self-organized criticality simulation.',
  category: 'simulation',
  params: [
    { id: 'dropRate', name: 'Drop Rate', type: 'number', default: 5, min: 1, max: 50, step: 1, category: 'simulation', description: 'Grains dropped per frame' },
    { id: 'threshold', name: 'Threshold', type: 'number', default: 4, min: 3, max: 8, step: 1, category: 'simulation', description: 'Grains needed to topple' },
    { id: 'resetOnClick', name: 'Click to Reset', type: 'boolean', default: true, category: 'interaction', description: 'Click to reset the pile' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#000000', '#00b4d8', '#00e5ff', '#ffbd00', '#ff0054'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a0a', category: 'color' }
  ],
  presets: [
    {
      name: 'Sandpile',
      params: { dropRate: 10, threshold: 4, resetOnClick: true, palette: ['#000000', '#00b4d8', '#00e5ff', '#ffbd00', '#ff0054'], bgColor: '#0a0a0a' }
    },
    {
      name: 'Slow Build',
      params: { dropRate: 1, threshold: 6, resetOnClick: false, palette: ['#050510', '#1a1a4e', '#3a3a8e', '#6a6abe', '#9a9ade'], bgColor: '#050510' }
    }
  ],
  generateCode: (params, seed) => `
    let cols, rows;
    let grid;
    let res = 4;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      pixelDensity(1);
      cols = floor(width / res);
      rows = floor(height / res);
      grid = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
    }

    function draw() {
      loadPixels();
      let threshold = ${params.threshold};
      let palette = ${JSON.stringify(params.palette)};

      // Add grains at center
      let cx = floor(cols / 2);
      let cy = floor(rows / 2);
      for (let i = 0; i < ${params.dropRate}; i++) {
        grid[cx][cy]++;
      }

      // Topple cells above threshold
      let toppled = false;
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          if (grid[x][y] >= threshold) {
            grid[x][y] -= threshold;
            if (x > 0) grid[x - 1][y]++;
            if (x < cols - 1) grid[x + 1][y]++;
            if (y > 0) grid[x][y - 1]++;
            if (y < rows - 1) grid[x][y + 1]++;
            toppled = true;
          }
        }
      }

      // Render
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          let val = grid[x][y];
          let colorIdx = min(val, palette.length - 1);
          let c = color(palette[colorIdx]);

          for (let px = 0; px < res; px++) {
            for (let py = 0; py < res; py++) {
              let idx = ((x * res + px) + (y * res + py) * width) * 4;
              if (idx < pixels.length) {
                pixels[idx] = red(c);
                pixels[idx + 1] = green(c);
                pixels[idx + 2] = blue(c);
                pixels[idx + 3] = 255;
              }
            }
          }
        }
      }
      updatePixels();
    }

    function mousePressed() {
      if (${params.resetOnClick}) {
        for (let x = 0; x < cols; x++)
          for (let y = 0; y < rows; y++)
            grid[x][y] = 0;
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
