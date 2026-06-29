import { Template } from '../types';

export const brushPlaygroundTemplate: Template = {
  id: 'brush-playground',
  name: 'Brush Playground',
  description: 'Expressive brush strokes that follow the mouse.',
  category: 'interaction',
  params: [
    { id: 'brushSize', name: 'Brush Size', type: 'number', default: 40, min: 5, max: 150, step: 1, category: 'interaction', description: 'Size of the brush tip' },
    { id: 'opacity', name: 'Opacity', type: 'number', default: 150, min: 10, max: 255, step: 1, category: 'color', description: 'Stroke transparency' },
    { id: 'jitter', name: 'Jitter', type: 'number', default: 10, min: 0, max: 50, step: 1, category: 'interaction', description: 'Random scatter for organic feel' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#f0f0f0', category: 'color' },
    { id: 'clearBg', name: 'Clear Background', type: 'boolean', default: false, category: 'interaction', description: 'Redraw background each frame (creates trail effect)' }
  ],
  presets: [
    {
      name: 'Ink Splatter',
      params: { brushSize: 20, opacity: 200, jitter: 30, palette: ['#000000', '#222222', '#444444'], bgColor: '#ffffff', clearBg: false }
    },
    {
      name: 'Pastel Clouds',
      params: { brushSize: 100, opacity: 50, jitter: 5, palette: ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff'], bgColor: '#f0f0f0', clearBg: false }
    }
  ],
  generateCode: (params, seed) => `
    let palette = ${JSON.stringify(params.palette)};
    let currentBrushColor;
    
    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      background('${params.bgColor}');
      currentBrushColor = random(palette);
    }
    
    function draw() {
      if (${params.clearBg}) {
        background('${params.bgColor}');
      }
      
      if (mouseIsPressed) {
        let c = color(currentBrushColor);
        c.setAlpha(${params.opacity});
        fill(c);
        noStroke();
        
        let size = ${params.brushSize};
        let j = ${params.jitter};
        
        for (let i = 0; i < 5; i++) {
          let offsetX = random(-j, j);
          let offsetY = random(-j, j);
          let s = random(size * 0.2, size);
          circle(mouseX + offsetX, mouseY + offsetY, s);
        }
      }
    }
    
    function mousePressed() {
      currentBrushColor = random(palette);
    }
    
    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      background('${params.bgColor}');
    }
  `
};
