import { Template } from '../types';

export const isometricCubesTemplate: Template = {
  id: 'isometric-cubes',
  name: 'Isometric Cubes',
  description: '3D isometric cube projection rendered on 2D canvas.',
  category: '3d',
  params: [
    { id: 'gridSize', name: 'Grid Size', type: 'number', default: 8, min: 3, max: 20, step: 1, category: 'layout', description: 'Number of cubes per row' },
    { id: 'cubeSize', name: 'Cube Size', type: 'number', default: 30, min: 10, max: 80, step: 5, category: 'geometry', suffix: 'px', description: 'Size of each cube' },
    { id: 'heightScale', name: 'Height Variation', type: 'number', default: 3, min: 0, max: 8, step: 1, category: '3d', description: 'Max random height multiplier' },
    { id: 'animated', name: 'Animated', type: 'boolean', default: true, category: 'animation', description: 'Bobbing animation' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a1a', category: 'color' }
  ],
  presets: [
    {
      name: 'Cityscape',
      params: { gridSize: 12, cubeSize: 25, heightScale: 6, animated: true, palette: ['#2d3436', '#636e72', '#b2bec3', '#dfe6e9'], bgColor: '#0a0a1a' }
    },
    {
      name: 'Candy Land',
      params: { gridSize: 6, cubeSize: 50, heightScale: 4, animated: false, palette: ['#ff9a9e', '#fad0c4', '#a18cd1', '#fbc2eb', '#f6d365'], bgColor: '#1a1a2e' }
    }
  ],
  generateCode: (params, seed) => `
    let palette = ${JSON.stringify(params.palette)};
    let heights = [];
    let gridSize = ${params.gridSize};
    let cubeSize = ${params.cubeSize};
    let heightScale = ${params.heightScale};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      for (let i = 0; i < gridSize; i++) {
        heights[i] = [];
        for (let j = 0; j < gridSize; j++) {
          heights[i][j] = floor(random(1, heightScale + 1));
        }
      }
    }

    function draw() {
      background('${params.bgColor}');
      let offset = cubeSize * 0.866;
      let startX = width / 2 - (gridSize * offset) / 2;
      let startY = height / 2 - (gridSize * cubeSize * 0.5) / 2;

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          let x = startX + (i - j) * offset;
          let y = startY + (i + j) * cubeSize * 0.5;
          let h = heights[i][j];

          if (${params.animated}) {
            h += sin(frameCount * 0.02 + i * 0.5 + j * 0.7) * 0.5;
          }

          let c = color(palette[(i + j) % palette.length]);
          let darker = color(palette[(i + j) % palette.length]);
          darker.setRed(max(0, red(darker) - 40));
          darker.setGreen(max(0, green(darker) - 40));
          darker.setBlue(max(0, blue(darker) - 40));

          let s = cubeSize;

          // Top face
          fill(c);
          noStroke();
          beginShape();
          vertex(x, y - h * s * 0.3);
          vertex(x + offset, y - h * s * 0.3 - s * 0.5);
          vertex(x, y - h * s * 0.3 - s);
          vertex(x - offset, y - h * s * 0.3 - s * 0.5);
          endShape(CLOSE);

          // Right face
          fill(darker);
          beginShape();
          vertex(x + offset, y - h * s * 0.3 - s * 0.5);
          vertex(x + offset, y - h * s * 0.3);
          vertex(x, y - h * s * 0.3 + s * 0.5);
          vertex(x, y - h * s * 0.3);
          endShape(CLOSE);

          // Left face
          let evenDarker = color(palette[(i + j) % palette.length]);
          evenDarker.setRed(max(0, red(evenDarker) - 70));
          evenDarker.setGreen(max(0, green(evenDarker) - 70));
          evenDarker.setBlue(max(0, blue(evenDarker) - 70));
          fill(evenDarker);
          beginShape();
          vertex(x - offset, y - h * s * 0.3 - s * 0.5);
          vertex(x, y - h * s * 0.3);
          vertex(x, y - h * s * 0.3 + s * 0.5);
          vertex(x - offset, y - h * s * 0.3);
          endShape(CLOSE);
        }
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
