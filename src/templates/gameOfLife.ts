import { Template } from '../types';

export const gameOfLifeTemplate: Template = {
  id: 'game-of-life',
  name: "Conway's Game of Life",
  description: 'Cellular automaton — life emerges from simple rules.',
  params: [
    { id: 'cellSize', name: 'Cell Size', type: 'number', default: 8, min: 3, max: 20, step: 1 },
    { id: 'density', name: 'Initial Density', type: 'number', default: 0.35, min: 0.1, max: 0.7, step: 0.05 },
    { id: 'speed', name: 'Simulation Speed', type: 'number', default: 8, min: 1, max: 30, step: 1 },
    { id: 'aliveColor', name: 'Alive Color', type: 'color', default: '#00ff88' },
    { id: 'deadColor', name: 'Dead Color', type: 'color', default: '#000000' },
    { id: 'fadeTrail', name: 'Fade Trail', type: 'boolean', default: true },
    { id: 'trailColor', name: 'Trail Color', type: 'color', default: '#003322' },
  ],
  presets: [
    { name: 'Matrix', params: { cellSize: 6, density: 0.3, speed: 12, aliveColor: '#00ff00', deadColor: '#000000', fadeTrail: true, trailColor: '#001500' } },
    { name: 'Neon', params: { cellSize: 10, density: 0.4, speed: 6, aliveColor: '#ff00ff', deadColor: '#0a000a', fadeTrail: true, trailColor: '#1a001a' } },
    { name: 'Ice', params: { cellSize: 8, density: 0.35, speed: 10, aliveColor: '#aaddff', deadColor: '#000814', fadeTrail: false, trailColor: '#001020' } },
  ],
  generateCode: (params, seed) => `
    let grid, cols, rows, frameCount2 = 0;
    let cs = ${params.cellSize};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      cols = floor(width / cs);
      rows = floor(height / cs);
      grid = makeGrid(true);
    }

    function makeGrid(random) {
      let g = [];
      for (let c = 0; c < cols; c++) {
        g[c] = [];
        for (let r = 0; r < rows; r++) {
          g[c][r] = random ? (Math.random() < ${params.density} ? 1 : 0) : 0;
        }
      }
      return g;
    }

    function draw() {
      background('${params.deadColor}');
      frameCount2++;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          let x = c * cs, y = r * cs;
          if (grid[c][r] === 1) {
            noStroke();
            fill('${params.aliveColor}');
            rect(x, y, cs - 1, cs - 1);
          } else if (${params.fadeTrail} && grid[c][r] === 2) {
            noStroke();
            fill('${params.trailColor}');
            rect(x, y, cs - 1, cs - 1);
          }
        }
      }

      if (frameCount2 % floor(60 / ${params.speed}) === 0) {
        let next = makeGrid(false);
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            let n = countNeighbors(grid, c, r);
            let alive = grid[c][r] === 1;
            if (alive && (n === 2 || n === 3)) next[c][r] = 1;
            else if (!alive && n === 3) next[c][r] = 1;
            else if (alive) next[c][r] = ${params.fadeTrail} ? 2 : 0;
            else next[c][r] = (grid[c][r] === 2) ? 0 : 0;
          }
        }
        grid = next;
      }
    }

    function countNeighbors(g, c, r) {
      let count = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          let cc = (c + i + cols) % cols, rr = (r + j + rows) % rows;
          if (g[cc][rr] === 1) count++;
        }
      }
      return count;
    }

    function mousePressed() {
      grid = makeGrid(true);
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      cols = floor(width / cs);
      rows = floor(height / cs);
      grid = makeGrid(true);
    }
  `,
};
