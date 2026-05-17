import { Template } from '../types';

export const kaleidoscopeTemplate: Template = {
  id: 'kaleidoscope',
  name: 'Kaleidoscope',
  description: 'Symmetrical kaleidoscope that responds to mouse movement.',
  params: [
    { id: 'segments', name: 'Segments', type: 'number', default: 12, min: 3, max: 24, step: 1 },
    { id: 'palette', name: 'Colors', type: 'color-array', default: ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0010' },
    { id: 'speed', name: 'Spin Speed', type: 'number', default: 0.3, min: 0, max: 2, step: 0.05 },
    { id: 'complexity', name: 'Complexity', type: 'number', default: 5, min: 2, max: 15, step: 1 },
    { id: 'glow', name: 'Glow Effect', type: 'boolean', default: true },
  ],
  presets: [
    { name: 'Crystal', params: { segments: 16, palette: ['#00ffff', '#0080ff', '#ffffff'], bgColor: '#000020', speed: 0.2, complexity: 7, glow: true } },
    { name: 'Fire Mandala', params: { segments: 8, palette: ['#ff4500', '#ff8c00', '#ffd700'], bgColor: '#0a0000', speed: 0.8, complexity: 4, glow: true } },
    { name: 'Forest', params: { segments: 6, palette: ['#006400', '#32cd32', '#90ee90', '#ffd700'], bgColor: '#0a1500', speed: 0.15, complexity: 8, glow: false } },
  ],
  generateCode: (params, seed) => `
    let t = 0;
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      colorMode(RGB, 255, 255, 255, 255);
      angleMode(RADIANS);
    }

    function draw() {
      background('${params.bgColor}');
      translate(width / 2, height / 2);

      let n = ${params.segments};
      let r = min(width, height) * 0.45;
      let comp = ${params.complexity};

      for (let s = 0; s < n; s++) {
        push();
        rotate((TWO_PI / n) * s + t * 0.01 * ${params.speed});

        for (let i = 1; i <= comp; i++) {
          let phase = t * 0.02 * ${params.speed} + i * 0.5;
          let c = palette[(s + i) % palette.length];
          let col = color(c);

          if (${params.glow}) {
            for (let g = 3; g >= 0; g--) {
              stroke(red(col), green(col), blue(col), 30 + g * 20);
              strokeWeight(2 - g * 0.4);
              noFill();
              let ri = r * (i / comp);
              let x1 = cos(phase) * ri * 0.4;
              let y1 = sin(phase * 1.3) * ri * 0.4;
              let x2 = cos(phase + PI * 0.5) * ri * 0.7;
              let y2 = sin(phase * 0.7 + 1) * ri * 0.5;
              bezier(x1, y1, x2, y2, x1 * -0.8, y2 * 0.5, x2 * 0.3, y1 * -0.8);
            }
          } else {
            stroke(col);
            strokeWeight(1.5);
            noFill();
            let ri = r * (i / comp);
            let x1 = cos(phase) * ri * 0.4;
            let y1 = sin(phase * 1.3) * ri * 0.4;
            bezier(x1, y1, ri * 0.5, ri * 0.2, -ri * 0.3, ri * 0.6, x1 * -0.5, y1 * -0.7);
          }
        }
        pop();
      }

      t++;
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
