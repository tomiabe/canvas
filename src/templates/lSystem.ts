import { Template } from '../types';

export const lSystemTemplate: Template = {
  id: 'l-system',
  name: 'L-System Plants',
  description: 'Lindenmayer systems — nature\'s growth grammar made visual.',
  params: [
    { id: 'preset', name: 'Plant Type', type: 'enum', default: 'fern', options: ['fern', 'bush', 'tree', 'algae', 'snowflake'] },
    { id: 'iterations', name: 'Iterations', type: 'number', default: 5, min: 2, max: 8, step: 1 },
    { id: 'angle', name: 'Branch Angle', type: 'number', default: 25, min: 5, max: 60, step: 1 },
    { id: 'stepLen', name: 'Step Length', type: 'number', default: 4, min: 1, max: 15, step: 0.5 },
    { id: 'stemColor', name: 'Stem Color', type: 'color', default: '#4a7c59' },
    { id: 'leafColor', name: 'Tip Color', type: 'color', default: '#90ee90' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0d1117' },
  ],
  presets: [
    { name: 'Rainforest', params: { preset: 'fern', iterations: 5, angle: 25, stepLen: 5, stemColor: '#2d6a4f', leafColor: '#52b788', bgColor: '#081c15', } },
    { name: 'Winter Tree', params: { preset: 'tree', iterations: 5, angle: 22, stepLen: 4, stemColor: '#bbbbbb', leafColor: '#dddddd', bgColor: '#0a0f1e', } },
    { name: 'Koch Flake', params: { preset: 'snowflake', iterations: 4, angle: 60, stepLen: 3, stemColor: '#aaddff', leafColor: '#ffffff', bgColor: '#000814', } },
  ],
  generateCode: (params, seed) => `
    let sentence = '';
    let rules = {};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      angleMode(DEGREES);
      buildLSystem('${params.preset}');
      drawLSystem();
      noLoop();
    }

    function buildLSystem(type) {
      let axiom, n = ${params.iterations};
      if (type === 'fern') {
        axiom = 'X';
        rules = { 'X': 'F+[[X]-X]-F[-FX]+X', 'F': 'FF' };
      } else if (type === 'bush') {
        axiom = 'F';
        rules = { 'F': 'FF-[-F+F+F]+[+F-F-F]' };
      } else if (type === 'tree') {
        axiom = 'F';
        rules = { 'F': 'F[+F]F[-F]F' };
      } else if (type === 'algae') {
        axiom = 'A';
        rules = { 'A': 'AB', 'B': 'A' };
      } else {
        axiom = 'F--F--F';
        rules = { 'F': 'F+F--F+F' };
      }
      sentence = axiom;
      for (let i = 0; i < n; i++) {
        sentence = sentence.split('').map(c => rules[c] || c).join('');
        if (sentence.length > 100000) break;
      }
    }

    function drawLSystem() {
      background('${params.bgColor}');
      let type = '${params.preset}';
      let startX = width / 2, startY = height * (type === 'snowflake' ? 0.6 : 0.9);
      if (type === 'algae') { startX = 50; startY = height / 2; }
      translate(startX, startY);
      if (type === 'snowflake') rotate(0);

      let stack = [];
      let step = ${params.stepLen};
      let ang = ${params.angle};
      let depth = 0;
      strokeWeight(1.5);

      for (let c of sentence) {
        if (c === 'F' || c === 'A' || c === 'B') {
          let t = min(1, depth / 8);
          stroke(lerpColor(color('${params.stemColor}'), color('${params.leafColor}'), t));
          line(0, 0, 0, -step);
          translate(0, -step);
        } else if (c === '+') {
          rotate(ang);
        } else if (c === '-') {
          rotate(-ang);
        } else if (c === '[') {
          stack.push({ x: 0, y: 0, a: 0 });
          push();
          depth++;
        } else if (c === ']') {
          pop();
          stack.pop();
          depth = max(0, depth - 1);
        }
      }
    }

    function mousePressed() {
      randomSeed(millis());
      clear();
      drawLSystem();
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); clear(); drawLSystem(); }
  `,
};
