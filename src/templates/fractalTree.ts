import { Template } from '../types';

export const fractalTreeTemplate: Template = {
  id: 'fractal-tree',
  name: 'Recursive Fractal Tree',
  description: 'A mathematical tree generated using recursive functions and transformations.',
  category: 'geometry',
  params: [
    { id: 'angle', name: 'Branch Angle', type: 'number', default: 0.5, min: 0.1, max: 1.5, step: 0.05, category: 'geometry', description: 'Angle of branch splits (radians)' },
    { id: 'depth', name: 'Recursion Depth', type: 'number', default: 8, min: 3, max: 12, step: 1, category: 'simulation', description: 'Number of recursive branch levels' },
    { id: 'length', name: 'Trunk Length', type: 'number', default: 120, min: 50, max: 300, step: 10, category: 'geometry', description: 'Initial trunk length' },
    { id: 'leafColor', name: 'Leaf Color', type: 'color', default: '#00ff88', category: 'color' },
    { id: 'trunkColor', name: 'Trunk Color', type: 'color', default: '#ffffff', category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#111111', category: 'color' }
  ],
  generateCode: (params, seed) => `
    let theta;
    function setup() {
      createCanvas(windowWidth, windowHeight);
    }
    
    function draw() {
      background('${params.bgColor}');
      frameRate(30);
      stroke('${params.trunkColor}');
      
      // Map mouseX to angle for interactive tree
      theta = map(mouseX, 0, width, 0, PI/2, true);
      // fallback to parameter if mouse is outside canvas
      if (mouseX <= 0 || mouseX >= width) {
         theta = ${params.angle};
      }
      
      translate(width/2, height);
      branch(${params.length}, 0);
    }
    
    function branch(h, currentDepth) {
      h *= 0.66;
      strokeWeight(map(h, 2, 100, 1, 5));
      
      if (currentDepth > ${params.depth}) {
         fill('${params.leafColor}');
         noStroke();
         circle(0, 0, 8);
         return;
      }
      
      stroke('${params.trunkColor}');
      line(0, 0, 0, -h);
      translate(0, -h);
      
      push();
      rotate(theta);
      branch(h, currentDepth + 1);
      pop();
      
      push();
      rotate(-theta);
      branch(h, currentDepth + 1);
      pop();
    }
    
    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
