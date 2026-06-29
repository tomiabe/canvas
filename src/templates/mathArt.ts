import { Template } from '../types';

export const mathArtTemplate: Template = {
  id: 'math-art',
  name: 'Lissajous Curves',
  description: 'Complex harmonic motion created with trigonometry.',
  category: 'geometry',
  params: [
    { id: 'freqX', name: 'X Frequency', type: 'number', default: 5, min: 1, max: 10, step: 1, category: 'geometry', description: 'Horizontal oscillation frequency' },
    { id: 'freqY', name: 'Y Frequency', type: 'number', default: 4, min: 1, max: 10, step: 1, category: 'geometry', description: 'Vertical oscillation frequency' },
    { id: 'phase', name: 'Phase Shift', type: 'number', default: 0, min: 0, max: 3.14, step: 0.1, category: 'animation', description: 'Phase offset between X and Y' },
    { id: 'complexity', name: 'Resolution', type: 'number', default: 200, min: 50, max: 500, step: 10, category: 'layout', description: 'Number of points in the curve' },
    { id: 'lineColor', name: 'Line Color', type: 'color', default: '#00e5ff', category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a0a', category: 'color' }
  ],
  generateCode: (params, seed) => `
    let t = 0;
    function setup() {
      createCanvas(windowWidth, windowHeight);
    }
    
    function draw() {
      let bg = color('${params.bgColor}');
      background(bg.levels[0], bg.levels[1], bg.levels[2], 20); // Add trail effect
      
      translate(width/2, height/2);
      stroke('${params.lineColor}');
      strokeWeight(2);
      noFill();
      
      beginShape();
      for(let i = 0; i < ${params.complexity}; i++) {
        let angle = map(i, 0, ${params.complexity}, 0, TWO_PI);
        let x = sin(angle * ${params.freqX} + t) * (min(width,height)*0.35);
        let y = sin(angle * ${params.freqY} + ${params.phase}) * (min(width,height)*0.35);
        vertex(x, y);
      }
      endShape();
      
      t += 0.02;
    }
    
    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
