import { Template } from '../types';

export const painterlyTemplate: Template = {
  id: 'painterly',
  name: 'Painterly Strokes',
  description: 'Algorithmic brushstrokes that build up like an oil painting over time.',
  params: [
    { id: 'strokesPerFrame', name: 'Strokes/Frame', type: 'number', default: 20, min: 1, max: 80, step: 1 },
    { id: 'strokeLen', name: 'Stroke Length', type: 'number', default: 40, min: 10, max: 120, step: 5 },
    { id: 'strokeWidth', name: 'Stroke Width', type: 'number', default: 8, min: 1, max: 30, step: 1 },
    { id: 'palette', name: 'Paint Colors', type: 'color-array', default: ['#e63946', '#457b9d', '#1d3557', '#a8dadc', '#f1faee', '#fca311'] },
    { id: 'bgColor', name: 'Canvas Color', type: 'color', default: '#f5f0e8' },
    { id: 'noiseScale', name: 'Direction Noise', type: 'number', default: 0.008, min: 0.001, max: 0.03, step: 0.001 },
    { id: 'opacity', name: 'Paint Opacity', type: 'number', default: 180, min: 20, max: 255, step: 5 },
  ],
  presets: [
    { name: 'Impressionist', params: { strokesPerFrame: 30, strokeLen: 30, strokeWidth: 6, palette: ['#e63946','#f77f00','#fcbf49','#eae2b7','#003049','#d62828'], bgColor: '#f5f0e8', noiseScale: 0.01, opacity: 160 } },
    { name: 'Dark Oil', params: { strokesPerFrame: 15, strokeLen: 60, strokeWidth: 12, palette: ['#10002b','#240046','#3c096c','#5a189a','#7b2d8b','#9d4edd'], bgColor: '#05000f', noiseScale: 0.006, opacity: 200 } },
    { name: 'Watercolor', params: { strokesPerFrame: 40, strokeLen: 25, strokeWidth: 4, palette: ['#bde0fe','#a2d2ff','#cdb4db','#ffc8dd','#ffafcc'], bgColor: '#ffffff', noiseScale: 0.015, opacity: 80 } },
  ],
  generateCode: (params, seed) => `
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      noiseSeed(${seed});
      background('${params.bgColor}');
    }

    function draw() {
      for (let i = 0; i < ${params.strokesPerFrame}; i++) {
        let x = random(width), y = random(height);
        let angle = noise(x * ${params.noiseScale}, y * ${params.noiseScale}) * TWO_PI * 2;
        let len = random(${params.strokeLen} * 0.5, ${params.strokeLen} * 1.5);
        let w = random(${params.strokeWidth} * 0.5, ${params.strokeWidth} * 1.5);
        let col = color(random(palette));

        stroke(red(col), green(col), blue(col), ${params.opacity});
        strokeWeight(w);
        strokeCap(ROUND);

        push();
        translate(x, y);
        rotate(angle);
        line(-len/2, 0, len/2, 0);

        // Slight brush texture
        stroke(red(col), green(col), blue(col), ${params.opacity} * 0.3);
        strokeWeight(w * 0.3);
        line(-len * 0.4, random(-w/3, w/3), len * 0.4, random(-w/3, w/3));
        pop();
      }
    }

    function mousePressed() { background('${params.bgColor}'); randomSeed(millis()); noiseSeed(millis()); }
    function windowResized() { resizeCanvas(windowWidth, windowHeight); background('${params.bgColor}'); }
  `,
};
