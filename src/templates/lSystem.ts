import { Template } from '../types';

export const lSystemTemplate: Template = {
  id: 'l-system',
  name: 'L-System',
  description: 'Formal grammar fractal plant growth using Lindenmayer systems.',
  category: 'geometry',
  params: [
    { id: 'iterations', name: 'Iterations', type: 'number', default: 5, min: 2, max: 7, step: 1, category: 'simulation', description: 'Number of recursive generations' },
    { id: 'angle', name: 'Branch Angle', type: 'number', default: 25, min: 10, max: 50, step: 1, category: 'geometry', suffix: '°', description: 'Angle of branch splits' },
    { id: 'length', name: 'Branch Length', type: 'number', default: 6, min: 2, max: 20, step: 1, category: 'geometry', description: 'Length of each segment' },
    { id: 'rule', name: 'Grammar Rule', type: 'enum', default: 'plant', options: ['plant', 'dragon', 'sierpinski', 'koch', 'weed'], category: 'geometry', description: 'L-system grammar to use' },
    { id: 'lineColor', name: 'Line Color', type: 'color', default: '#6bcb77', category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a0a', category: 'color' }
  ],
  presets: [
    {
      name: 'Fern',
      params: { iterations: 6, angle: 20, length: 4, rule: 'plant', lineColor: '#00ff88', bgColor: '#0a0a0a' }
    },
    {
      name: 'Dragon Curve',
      params: { iterations: 14, angle: 90, length: 3, rule: 'dragon', lineColor: '#ff6b6b', bgColor: '#0a0a0a' }
    }
  ],
  generateCode: (params, seed) => `
    let axiom, rules, sentence;
    let angle;
    let len = ${params.length};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      angle = radians(${params.angle});
      let rule = '${params.rule}';

      if (rule === 'plant') {
        axiom = 'X';
        rules = { 'X': 'F+[[X]-X]-F[-FX]+X', 'F': 'FF' };
      } else if (rule === 'dragon') {
        axiom = 'FX';
        rules = { 'X': 'X+YF+', 'Y': '-FX-Y' };
      } else if (rule === 'sierpinski') {
        axiom = 'F-G-G';
        rules = { 'F': 'F-G+F+G-F', 'G': 'GG' };
      } else if (rule === 'koch') {
        axiom = 'F';
        rules = { 'F': 'F+F-F-F+F' };
      } else if (rule === 'weed') {
        axiom = 'F';
        rules = { 'F': 'F[+F]F[-F]F' };
      }

      sentence = axiom;
      for (let i = 0; i < ${params.iterations}; i++) {
        let next = '';
        for (let c of sentence) {
          next += rules[c] || c;
        }
        sentence = next;
      }

      background('${params.bgColor}');
      stroke('${params.lineColor}');
      noFill();

      resetMatrix();
      if (rule === 'dragon' || rule === 'sierpinski' || rule === 'koch') {
        translate(width / 4, height / 2);
      } else {
        translate(width / 2, height);
      }

      for (let c of sentence) {
        if (c === 'F' || c === 'G') {
          line(0, 0, 0, -len);
          translate(0, -len);
        } else if (c === '+') {
          rotate(angle);
        } else if (c === '-') {
          rotate(-angle);
        } else if (c === '[') {
          push();
        } else if (c === ']') {
          pop();
        }
      }
    }

    function draw() { noLoop(); }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      background('${params.bgColor}');
      stroke('${params.lineColor}');
      noFill();
      if ('${params.rule}' === 'dragon' || '${params.rule}' === 'sierpinski' || '${params.rule}' === 'koch') {
        translate(width / 4, height / 2);
      } else {
        translate(width / 2, height);
      }
      for (let c of sentence) {
        if (c === 'F' || c === 'G') {
          line(0, 0, 0, -len);
          translate(0, -len);
        } else if (c === '+') rotate(angle);
        else if (c === '-') rotate(-angle);
        else if (c === '[') push();
        else if (c === ']') pop();
      }
    }
  `
};
