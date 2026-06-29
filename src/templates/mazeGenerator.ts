import { Template } from '../types';

export const mazeGeneratorTemplate: Template = {
  id: 'maze-generator',
  name: 'Maze Generator',
  description: 'DFS recursive backtracking maze generation with animated solving.',
  category: 'simulation',
  params: [
    { id: 'cellSize', name: 'Cell Size', type: 'number', default: 20, min: 5, max: 60, step: 5, category: 'layout', suffix: 'px', description: 'Size of each maze cell' },
    { id: 'speed', name: 'Generation Speed', type: 'number', default: 10, min: 1, max: 60, step: 1, category: 'animation', description: 'Frames between steps' },
    { id: 'showSolve', name: 'Show Solution', type: 'boolean', default: false, category: 'simulation', description: 'Highlight the solution path' },
    { id: 'wallColor', name: 'Wall Color', type: 'color', default: '#00e5ff', category: 'color', description: 'Color of maze walls' },
    { id: 'pathColor', name: 'Path Color', type: 'color', default: '#ff6b9d', category: 'color', description: 'Color of solution path' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a1a', category: 'color' }
  ],
  presets: [
    {
      name: 'Neon Maze',
      params: { cellSize: 15, speed: 5, showSolve: true, wallColor: '#39ff14', pathColor: '#ff00ff', bgColor: '#000000' }
    },
    {
      name: 'Tiny Labyrinth',
      params: { cellSize: 40, speed: 1, showSolve: false, wallColor: '#8d99ae', pathColor: '#ef233c', bgColor: '#2b2d42' }
    }
  ],
  generateCode: (params, seed) => `
    let cols, rows;
    let grid = [];
    let current;
    let stack = [];
    let solving = false;
    let solution = [];
    let visited = [];
    let frameCount = 0;
    let generated = false;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      let cellSize = ${params.cellSize};
      cols = floor(width / cellSize);
      rows = floor(height / cellSize);

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          grid.push({ i, j, walls: [true, true, true, true], visited: false });
        }
      }
      current = grid[0];
      current.visited = true;
    }

    function index(i, j) {
      if (i < 0 || j < 0 || i >= cols || j >= rows) return -1;
      return i + j * cols;
    }

    function removeWalls(a, b) {
      let dx = a.i - b.i;
      let dy = a.j - b.j;
      if (dx === 1) { a.walls[3] = false; b.walls[1] = false; }
      if (dx === -1) { a.walls[1] = false; b.walls[3] = false; }
      if (dy === 1) { a.walls[0] = false; b.walls[2] = false; }
      if (dy === -1) { a.walls[2] = false; b.walls[0] = false; }
    }

    function getNeighbors(cell) {
      let neighbors = [];
      let dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (let d of dirs) {
        let idx = index(cell.i + d[0], cell.j + d[1]);
        if (idx !== -1 && !grid[idx].visited) neighbors.push(grid[idx]);
      }
      return neighbors;
    }

    function draw() {
      background('${params.bgColor}');
      let cellSize = ${params.cellSize};

      if (!generated) {
        frameCount++;
        if (frameCount % ${params.speed} === 0) {
          let neighbors = getNeighbors(current);
          if (neighbors.length > 0) {
            let next = random(neighbors);
            stack.push(current);
            removeWalls(current, next);
            next.visited = true;
            current = next;
          } else if (stack.length > 0) {
            current = stack.pop();
          } else {
            generated = true;
            if (${params.showSolve}) {
              solving = true;
              visited = [];
              solution = [];
              dfsSolve(grid[0], []);
            }
          }
        }
      }

      stroke('${params.wallColor}');
      strokeWeight(2);
      for (let cell of grid) {
        let x = cell.i * cellSize;
        let y = cell.j * cellSize;
        if (cell.walls[0]) line(x, y, x + cellSize, y);
        if (cell.walls[1]) line(x + cellSize, y, x + cellSize, y + cellSize);
        if (cell.walls[2]) line(x, y + cellSize, x + cellSize, y + cellSize);
        if (cell.walls[3]) line(x, y, x, y + cellSize);
      }

      if (${params.showSolve} && solution.length > 0) {
        noStroke();
        fill('${params.pathColor}');
        for (let cell of solution) {
          let x = cell.i * cellSize + cellSize / 2;
          let y = cell.j * cellSize + cellSize / 2;
          circle(x, y, cellSize * 0.4);
        }
      }
    }

    function dfsSolve(cell, path) {
      if (cell === grid[grid.length - 1]) {
        solution = [...path, cell];
        return true;
      }
      visited.push(cell);
      let dirs = [
        [0, -1, 0], [0, 1, 2], [-1, 0, 3], [1, 0, 1]
      ];
      for (let d of dirs) {
        let ni = cell.i + d[0], nj = cell.j + d[1];
        let idx = index(ni, nj);
        if (idx !== -1 && !visited.includes(grid[idx]) && !cell.walls[d[2]]) {
          if (dfsSolve(grid[idx], [...path, cell])) return true;
        }
      }
      return false;
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
