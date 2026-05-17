import { Template } from '../types';

export const mathArtTemplate: Template = {
  id: 'math-art',
  name: 'Lissajous Curves',
  description: 'Elegant harmonic curves traced by parametric equations.',
  params: [
    { id: 'freqX', name: 'Frequency X', type: 'number', default: 3, min: 1, max: 10, step: 1 },
    { id: 'freqY', name: 'Frequency Y', type: 'number', default: 2, min: 1, max: 10, step: 1 },
    { id: 'phase', name: 'Phase Shift', type: 'number', default: 0.5, min: 0, max: 3.14, step: 0.01 },
    { id: 'layers', name: 'Layers', type: 'number', default: 5, min: 1, max: 20, step: 1 },
    { id: 'speed', name: 'Anim Speed', type: 'number', default: 0.01, min: 0, max: 0.05, step: 0.001 },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0', '#ffbe0b'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000' },
  ],
  presets: [
    { name: 'Infinity', params: { freqX: 2, freqY: 1, phase: 1.57, layers: 8, speed: 0.008, palette: ['#00ffff', '#0080ff', '#8000ff'], bgColor: '#000000' } },
    { name: 'Butterfly', params: { freqX: 5, freqY: 4, phase: 1.0, layers: 12, speed: 0.005, palette: ['#ff69b4', '#ff1493', '#c71585', '#ff00ff'], bgColor: '#0d0010' } },
    { name: 'Star Weave', params: { freqX: 7, freqY: 3, phase: 0.8, layers: 6, speed: 0.012, palette: ['#ffd700', '#ff8c00', '#ff4500'], bgColor: '#0a0500' } },
  ],
  generateCode: (params, seed) => `
    let t = 0;
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      colorMode(HSB, 360, 100, 100, 100);
    }

    function draw() {
      background(0, 0, 0, 8);
      translate(width / 2, height / 2);

      let r = min(width, height) * 0.42;
      let layers = ${params.layers};
      let palette = ${JSON.stringify(params.palette)};

      for (let l = 0; l < layers; l++) {
        let phaseOffset = (l / layers) * TWO_PI;
        let c = color(palette[l % palette.length]);
        stroke(hue(c), saturation(c), brightness(c), 80 - l * (60 / layers));
        strokeWeight(1.5);
        noFill();

        beginShape();
        for (let i = 0; i <= 360; i++) {
          let a = radians(i);
          let x = r * sin(${params.freqX} * a + t + phaseOffset + ${params.phase});
          let y = r * sin(${params.freqY} * a + t + phaseOffset);
          vertex(x, y);
        }
        endShape(CLOSE);
      }

      t += ${params.speed};
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
