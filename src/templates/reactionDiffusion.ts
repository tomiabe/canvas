import { Template } from '../types';

export const reactionDiffusionTemplate: Template = {
  id: 'reaction-diffusion',
  name: 'Reaction-Diffusion',
  description: 'Gray-Scott reaction-diffusion system producing organic patterns.',
  category: 'simulation',
  params: [
    { id: 'feed', name: 'Feed Rate', type: 'number', default: 0.055, min: 0.01, max: 0.1, step: 0.002, category: 'simulation', description: 'Rate of chemical A feeding' },
    { id: 'kill', name: 'Kill Rate', type: 'number', default: 0.062, min: 0.02, max: 0.08, step: 0.001, category: 'simulation', description: 'Rate of chemical B killing' },
    { id: 'diffA', name: 'Diffusion A', type: 'number', default: 1.0, min: 0.1, max: 2, step: 0.1, category: 'simulation', description: 'Diffusion rate of chemical A' },
    { id: 'diffB', name: 'Diffusion B', type: 'number', default: 0.5, min: 0.05, max: 1, step: 0.05, category: 'simulation', description: 'Diffusion rate of chemical B' },
    { id: 'color1', name: 'Chemical A Color', type: 'color', default: '#000000', category: 'color' },
    { id: 'color2', name: 'Chemical B Color', type: 'color', default: '#00e5ff', category: 'color' }
  ],
  presets: [
    {
      name: 'Coral Growth',
      params: { feed: 0.037, kill: 0.06, diffA: 1.0, diffB: 0.5, color1: '#0a0a0a', color2: '#ff6b9d' }
    },
    {
      name: 'Slime Mold',
      params: { feed: 0.058, kill: 0.065, diffA: 1.0, diffB: 0.3, color1: '#000000', color2: '#ffd700' }
    }
  ],
  generateCode: (params, seed) => `
    let grid;
    let next;
    let w = 2;
    let cols, rows;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      pixelDensity(1);
      cols = floor(width / w);
      rows = floor(height / w);
      grid = new Array(cols);
      next = new Array(cols);
      for (let i = 0; i < cols; i++) {
        grid[i] = new Array(rows).fill(1);
        next[i] = new Array(rows).fill(1);
      }
      // Seed with chemical B in center
      let cx = floor(cols / 2);
      let cy = floor(rows / 2);
      let r = 10;
      for (let i = cx - r; i < cx + r; i++) {
        for (let j = cy - r; j < cy + r; j++) {
          if (i > 0 && i < cols && j > 0 && j < rows) {
            grid[i][j] = 0;
          }
        }
      }
    }

    function draw() {
      let dA = ${params.diffA};
      let dB = ${params.diffB};
      let feed = ${params.feed};
      let kill = ${params.kill};

      for (let i = 1; i < cols - 1; i++) {
        for (let j = 1; j < rows - 1; j++) {
          let a = grid[i][j];
          let b = 1 - a;
          let laplaceA = 0;
          let laplaceB = 0;
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              let nei = grid[i + di]?.[j + dj] ?? a;
              laplaceA += nei * (di === 0 && dj === 0 ? -1 : 0.2);
              laplaceB += (1 - nei) * (di === 0 && dj === 0 ? -1 : 0.2);
            }
          }
          let reaction = a * b * b;
          let newA = a + (dA * laplaceA - reaction + feed * (1 - a));
          let newB = b + (dB * laplaceB + reaction - (feed + kill) * b);
          next[i][j] = constrain(newA, 0, 1);
        }
      }

      let temp = grid;
      grid = next;
      next = temp;

      loadPixels();
      let c1 = color('${params.color1}');
      let c2 = color('${params.color2}');

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          let a = grid[i][j];
          let col = lerpColor(c2, c1, a);
          for (let x = i * w; x < (i + 1) * w; x++) {
            for (let y = j * w; y < (j + 1) * w; y++) {
              let idx = (x + y * width) * 4;
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
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
