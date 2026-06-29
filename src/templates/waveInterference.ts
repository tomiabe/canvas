import { Template } from '../types';

export const waveInterferenceTemplate: Template = {
  id: 'wave-interference',
  name: 'Wave Interference',
  description: 'Simulation of overlapping waves creating interference patterns.',
  category: 'simulation',
  params: [
    { id: 'waveCount', name: 'Wave Sources', type: 'number', default: 3, min: 1, max: 8, step: 1, category: 'simulation', description: 'Number of wave emitters' },
    { id: 'frequency', name: 'Frequency', type: 'number', default: 0.02, min: 0.005, max: 0.08, step: 0.003, category: 'simulation', description: 'Wave oscillation speed' },
    { id: 'amplitude', name: 'Amplitude', type: 'number', default: 100, min: 20, max: 255, step: 5, category: 'simulation', description: 'Wave intensity' },
    { id: 'speed', name: 'Animation Speed', type: 'number', default: 0.03, min: 0.005, max: 0.1, step: 0.005, category: 'animation', description: 'How fast waves propagate' },
    { id: 'color1', name: 'Wave Color 1', type: 'color', default: '#ff0054', category: 'color' },
    { id: 'color2', name: 'Wave Color 2', type: 'color', default: '#00e5ff', category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#050510', category: 'color' }
  ],
  presets: [
    {
      name: 'Water Ripples',
      params: { waveCount: 2, frequency: 0.015, amplitude: 150, speed: 0.02, color1: '#00b4d8', color2: '#90e0ef', bgColor: '#03045e' }
    },
    {
      name: 'Quantum',
      params: { waveCount: 6, frequency: 0.04, amplitude: 80, speed: 0.05, color1: '#39ff14', color2: '#ff00ff', bgColor: '#000000' }
    }
  ],
  generateCode: (params, seed) => `
    let sources = [];
    let t = 0;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      pixelDensity(1);
      for (let i = 0; i < ${params.waveCount}; i++) {
        sources.push({
          x: random(width * 0.2, width * 0.8),
          y: random(height * 0.2, height * 0.8),
          phase: random(TWO_PI)
        });
      }
    }

    function draw() {
      loadPixels();
      t += ${params.speed};

      let c1 = color('${params.color1}');
      let c2 = color('${params.color2}');

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          let sum = 0;
          for (let s of sources) {
            let d = dist(x, y, s.x, s.y);
            sum += sin(d * ${params.frequency} - t + s.phase) * ${params.amplitude};
          }
          let val = sum / sources.length;
          val = constrain(val, -${params.amplitude}, ${params.amplitude});
          let norm = map(val, -${params.amplitude}, ${params.amplitude}, 0, 1);

          let col = lerpColor(c1, c2, norm);

          let idx = (x + y * width) * 4;
          pixels[idx] = red(col);
          pixels[idx + 1] = green(col);
          pixels[idx + 2] = blue(col);
          pixels[idx + 3] = 255;
        }
      }
      updatePixels();
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
