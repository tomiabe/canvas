import { Template } from '../types';

export const sandPileTemplate: Template = {
  id: 'sand-pile',
  name: 'Sand Simulation',
  description: 'Falling sand particles that pile up realistically. Click to pour sand.',
  params: [
    { id: 'gravity', name: 'Gravity', type: 'number', default: 1, min: 0.3, max: 3, step: 0.1 },
    { id: 'cellSize', name: 'Grain Size', type: 'number', default: 4, min: 2, max: 10, step: 1 },
    { id: 'palette', name: 'Sand Colors', type: 'color-array', default: ['#c2a35b', '#d4b66a', '#e8c87a', '#f0d090', '#b8944a'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#1a1008' },
    { id: 'spawnRate', name: 'Spawn Rate', type: 'number', default: 5, min: 1, max: 20, step: 1 },
    { id: 'wind', name: 'Wind', type: 'number', default: 0, min: -3, max: 3, step: 0.5 },
  ],
  presets: [
    { name: 'Desert Sand', params: { gravity: 1, cellSize: 4, palette: ['#c2a35b','#d4b66a','#e8c87a','#f0d090','#b8944a'], bgColor: '#1a1008', spawnRate: 5, wind: 0 } },
    { name: 'Colored Sand', params: { gravity: 1, cellSize: 5, palette: ['#ff4444','#ff8844','#ffff44','#44ff44','#4444ff','#ff44ff'], bgColor: '#111111', spawnRate: 3, wind: 0 } },
    { name: 'Snowfall', params: { gravity: 0.5, cellSize: 3, palette: ['#ffffff','#eeeeff','#ddeeff','#ccddff'], bgColor: '#000814', spawnRate: 8, wind: 1 } },
  ],
  generateCode: (params, seed) => `
    let cs = ${params.cellSize};
    let cols, rows, grid;
    let frameCount2 = 0;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      cols = floor(width / cs);
      rows = floor(height / cs);
      grid = Array.from({ length: cols }, () => new Array(rows).fill(0));
    }

    let palette = ${JSON.stringify(params.palette)};

    function draw() {
      background('${params.bgColor}');
      frameCount2++;

      if (mouseIsPressed) {
        let mx = floor(mouseX / cs), my = floor(mouseY / cs);
        for (let s = 0; s < ${params.spawnRate}; s++) {
          let nx = constrain(mx + floor(random(-2, 3)), 0, cols-1);
          let ny = constrain(my + floor(random(-1, 2)), 0, rows-1);
          if (grid[nx][ny] === 0) grid[nx][ny] = floor(random(1, palette.length + 1));
        }
      }

      // Simulate
      for (let x = 0; x < cols; x++) {
        for (let y = rows - 1; y >= 0; y--) {
          if (grid[x][y] === 0) continue;
          let below = y + 1;
          if (below >= rows) continue;

          let wind = ${params.wind};
          let wx = floor(random() < abs(wind) ? sign(wind) : 0);
          let nx = constrain(x + wx, 0, cols-1);

          if (grid[nx][below] === 0) {
            grid[nx][below] = grid[x][y];
            grid[x][y] = 0;
          } else if (x > 0 && grid[x-1][below] === 0) {
            grid[x-1][below] = grid[x][y];
            grid[x][y] = 0;
          } else if (x < cols-1 && grid[x+1][below] === 0) {
            grid[x+1][below] = grid[x][y];
            grid[x][y] = 0;
          }
        }
      }

      // Draw
      noStroke();
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          if (grid[x][y] > 0) {
            fill(palette[(grid[x][y] - 1) % palette.length]);
            rect(x * cs, y * cs, cs, cs);
          }
        }
      }
    }

    function sign(n) { return n > 0 ? 1 : n < 0 ? -1 : 0; }

    function keyPressed() {
      if (key === ' ') {
        grid = Array.from({ length: cols }, () => new Array(rows).fill(0));
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      cols = floor(width / cs); rows = floor(height / cs);
      grid = Array.from({ length: cols }, () => new Array(rows).fill(0));
    }
  `,
};
