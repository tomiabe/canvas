import { Template } from '../types';

export const gridPatternTemplate: Template = {
  id: 'grid-pattern',
  name: 'Geometric Grid',
  description: 'Structured grid with random geometric shapes.',
  category: 'geometry',
  params: [
    { id: 'gridSize', name: 'Grid Size', type: 'number', default: 40, min: 10, max: 100, step: 5, category: 'layout', suffix: 'px', description: 'Size of each grid cell' },
    { id: 'padding', name: 'Padding', type: 'number', default: 5, min: 0, max: 20, step: 1, category: 'layout', description: 'Space between shapes and cell edges' },
    { id: 'shapeType', name: 'Shape Type', type: 'enum', default: 'mixed', options: ['mixed', 'circles', 'squares', 'triangles'], category: 'geometry' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ffbe0b', '#fb5607', '#ff006e', '#8338ec', '#3a86ff'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#111111', category: 'color' },
    { id: 'animated', name: 'Animated', type: 'boolean', default: false, category: 'animation', description: 'Animate shapes rotating and pulsing' }
  ],
  presets: [
    {
      name: 'Bauhaus',
      params: { gridSize: 60, padding: 0, shapeType: 'mixed', palette: ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557'], bgColor: '#f1faee', animated: false }
    },
    {
      name: 'Neon Pulse',
      params: { gridSize: 30, padding: 10, shapeType: 'circles', palette: ['#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#0000ff'], bgColor: '#000000', animated: true }
    }
  ],
  generateCode: (params, seed) => `
    let palette = ${JSON.stringify(params.palette)};
    let shapes = [];
    
    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      noLoop();
      if (${params.animated}) {
        loop();
      }
      generateGrid();
    }
    
    function generateGrid() {
      shapes = [];
      let size = ${params.gridSize};
      let pad = ${params.padding};
      let cols = floor(width / size);
      let rows = floor(height / size);
      let offsetX = (width - (cols * size)) / 2;
      let offsetY = (height - (rows * size)) / 2;
      
      for(let i = 0; i < cols; i++) {
        for(let j = 0; j < rows; j++) {
          let x = offsetX + i * size + size/2;
          let y = offsetY + j * size + size/2;
          let s = size - pad * 2;
          
          let type = '${params.shapeType}';
          if (type === 'mixed') {
            let types = ['circle', 'square', 'triangle'];
            type = types[floor(random(types.length))];
          } else {
            type = type.replace('s', ''); // circles -> circle
          }
          
          shapes.push({
            x, y, s, type,
            color: random(palette),
            rotation: floor(random(4)) * HALF_PI,
            phase: random(TWO_PI)
          });
        }
      }
    }
    
    function draw() {
      background('${params.bgColor}');
      rectMode(CENTER);
      noStroke();
      
      for(let sh of shapes) {
        push();
        translate(sh.x, sh.y);
        
        if (${params.animated}) {
          rotate(sh.rotation + sin(frameCount * 0.02 + sh.phase) * 0.5);
          scale(map(sin(frameCount * 0.05 + sh.phase), -1, 1, 0.5, 1));
        } else {
          rotate(sh.rotation);
        }
        
        fill(sh.color);
        
        if (sh.type === 'circle') {
          circle(0, 0, sh.s);
        } else if (sh.type === 'square') {
          rect(0, 0, sh.s, sh.s);
        } else if (sh.type === 'triangle') {
          triangle(-sh.s/2, sh.s/2, sh.s/2, sh.s/2, 0, -sh.s/2);
        }
        pop();
      }
    }
    
    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      randomSeed(${seed}); // Keep same pattern on resize
      generateGrid();
      if (!${params.animated}) {
        draw();
      }
    }
  `
};
