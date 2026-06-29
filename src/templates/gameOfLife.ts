import { Template } from '../types';

export const gameOfLifeTemplate: Template = {
  id: 'game-of-life',
  name: 'Game of Life',
  description: "Conway's Game of Life cellular automaton simulation.",
  category: 'simulation',
  params: [
    { id: 'cellSize', name: 'Cell Size', type: 'number', default: 8, min: 2, max: 30, step: 1, category: 'layout', description: 'Size of each cell in pixels' },
    { id: 'speed', name: 'Sim Speed', type: 'number', default: 10, min: 1, max: 60, step: 1, category: 'animation', description: 'Frames per generation' },
    { id: 'fillPercent', name: 'Initial Fill %', type: 'number', default: 40, min: 1, max: 99, step: 1, category: 'simulation', description: 'Percentage of alive cells at start' },
    { id: 'aliveColor', name: 'Alive Color', type: 'color', default: '#00ff88', category: 'color', description: 'Color of living cells' },
    { id: 'deadColor', name: 'Dead Color', type: 'color', default: '#0a0a0a', category: 'color', description: 'Color of dead cells' },
    { id: 'gridColor', name: 'Grid Color', type: 'color', default: '#1a1a1a', category: 'color', description: 'Color of grid lines' },
    { id: 'showGrid', name: 'Show Grid', type: 'boolean', default: false, category: 'layout', description: 'Toggle grid line visibility' }
  ],
  presets: [
    {
      name: 'Dense Soup',
      params: { cellSize: 4, speed: 15, fillPercent: 55, aliveColor: '#ff6b6b', deadColor: '#0a0a0a', gridColor: '#1a1a1a', showGrid: false }
    },
    {
      name: 'Gliders',
      params: { cellSize: 16, speed: 5, fillPercent: 10, aliveColor: '#4d96ff', deadColor: '#000000', gridColor: '#222222', showGrid: true }
    }
  ],
  generateCode: (params, seed) => `
    let grid, next;
    let cols, rows;
    let cellSize = ${params.cellSize};
    let frameCounter = 0;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      cols = floor(width / cellSize);
      rows = floor(height / cellSize);
      grid = make2DArray(cols, rows);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          grid[i][j] = random(100) < ${params.fillPercent} ? 1 : 0;
        }
      }
      next = make2DArray(cols, rows);
    }

    function make2DArray(cols, rows) {
      let arr = new Array(cols);
      for (let i = 0; i < cols; i++) arr[i] = new Array(rows).fill(0);
      return arr;
    }

    function draw() {
      frameCounter++;
      if (frameCounter < ${params.speed}) {
        // Just draw current state
        drawGrid();
        return;
      }
      frameCounter = 0;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          let state = grid[i][j];
          let neighbors = countNeighbors(grid, i, j);
          if (state === 0 && neighbors === 3) next[i][j] = 1;
          else if (state === 1 && (neighbors < 2 || neighbors > 3)) next[i][j] = 0;
          else next[i][j] = state;
        }
      }

      let temp = grid;
      grid = next;
      next = temp;

      drawGrid();
    }

    function countNeighbors(grid, x, y) {
      let sum = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          let col = (x + i + cols) % cols;
          let row = (y + j + rows) % rows;
          sum += grid[col][row];
        }
      }
      sum -= grid[x][y];
      return sum;
    }

    function drawGrid() {
      background('${params.deadColor}');
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          if (grid[i][j] === 1) {
            fill('${params.aliveColor}');
            noStroke();
            rect(i * cellSize, j * cellSize, cellSize, cellSize);
          } else if (${params.showGrid}) {
            noFill();
            stroke('${params.gridColor}');
            strokeWeight(0.5);
            rect(i * cellSize, j * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    function mouseDragged() {
      let i = floor(mouseX / cellSize);
      let j = floor(mouseY / cellSize);
      if (i >= 0 && i < cols && j >= 0 && j < rows) grid[i][j] = 1;
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
