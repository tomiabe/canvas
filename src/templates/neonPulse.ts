import { Template } from '../types';

export const neonPulseTemplate: Template = {
  id: 'neon-pulse',
  name: 'Neon Pulse',
  description: 'Concentric pulsing rings with glowing neon edges and beat-like rhythm.',
  params: [
    { id: 'rings', name: 'Ring Count', type: 'number', default: 10, min: 3, max: 25, step: 1 },
    { id: 'speed', name: 'Pulse Speed', type: 'number', default: 2, min: 0.5, max: 8, step: 0.5 },
    { id: 'palette', name: 'Neon Colors', type: 'color-array', default: ['#ff00cc', '#00ffcc', '#ffcc00', '#00ccff'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000' },
    { id: 'maxRadius', name: 'Max Radius', type: 'number', default: 400, min: 100, max: 800, step: 20 },
    { id: 'glowSize', name: 'Glow Size', type: 'number', default: 15, min: 3, max: 40, step: 1 },
    { id: 'shape', name: 'Ring Shape', type: 'enum', default: 'circle', options: ['circle', 'hexagon', 'square', 'triangle'] },
  ],
  presets: [
    { name: 'Synthwave', params: { rings: 12, speed: 2.5, palette: ['#ff00cc','#cc00ff','#0099ff'], bgColor: '#050010', maxRadius: 450, glowSize: 20, shape: 'circle' } },
    { name: 'Matrix', params: { rings: 15, speed: 4, palette: ['#00ff00','#00cc00','#009900'], bgColor: '#000500', maxRadius: 500, glowSize: 10, shape: 'hexagon' } },
    { name: 'Cyber', params: { rings: 8, speed: 1.5, palette: ['#00ffff','#ff4400'], bgColor: '#000000', maxRadius: 380, glowSize: 18, shape: 'square' } },
  ],
  generateCode: (params, seed) => `
    let t = 0;
    let palette = ${JSON.stringify(params.palette)};

    function drawShape(type, r) {
      if (type === 'circle') {
        circle(0, 0, r * 2);
      } else if (type === 'hexagon') {
        beginShape();
        for (let i = 0; i < 6; i++) {
          let a = (TWO_PI / 6) * i - PI / 6;
          vertex(cos(a) * r, sin(a) * r);
        }
        endShape(CLOSE);
      } else if (type === 'square') {
        rectMode(CENTER);
        rect(0, 0, r * 1.6, r * 1.6);
      } else {
        beginShape();
        for (let i = 0; i < 3; i++) {
          let a = (TWO_PI / 3) * i - HALF_PI;
          vertex(cos(a) * r, sin(a) * r);
        }
        endShape(CLOSE);
      }
    }

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      colorMode(RGB, 255, 255, 255, 255);
    }

    function draw() {
      background('${params.bgColor}');
      translate(width/2, height/2);
      noFill();

      let n = ${params.rings};
      let maxR = min(${params.maxRadius}, min(width, height) * 0.45);

      for (let i = 0; i < n; i++) {
        let phase = (t * ${params.speed} / 100 + i / n) % 1;
        let r = phase * maxR;
        let alpha = (1 - phase) * 255;

        let col = color(palette[i % palette.length]);

        // Glow layers
        for (let g = ${params.glowSize}; g > 0; g -= 3) {
          stroke(red(col), green(col), blue(col), alpha * (1 - g / ${params.glowSize}) * 0.5);
          strokeWeight(g);
          drawShape('${params.shape}', r);
        }

        // Core
        stroke(red(col), green(col), blue(col), alpha);
        strokeWeight(1.5);
        drawShape('${params.shape}', r);
      }

      t++;
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
