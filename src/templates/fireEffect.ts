import { Template } from '../types';

export const fireEffectTemplate: Template = {
  id: 'fire-effect',
  name: 'Fire Simulation',
  description: 'Realistic fire simulation using noise-based heat maps.',
  params: [
    { id: 'intensity', name: 'Intensity', type: 'number', default: 0.8, min: 0.1, max: 1.5, step: 0.05 },
    { id: 'spread', name: 'Spread', type: 'number', default: 0.015, min: 0.005, max: 0.04, step: 0.001 },
    { id: 'height', name: 'Flame Height', type: 'number', default: 0.6, min: 0.2, max: 1.0, step: 0.05 },
    { id: 'fireColor', name: 'Fire Tint', type: 'enum', default: 'classic', options: ['classic', 'blue', 'green', 'purple', 'white'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000' },
    { id: 'wind', name: 'Wind', type: 'number', default: 0, min: -0.5, max: 0.5, step: 0.05 },
  ],
  presets: [
    { name: 'Bonfire', params: { intensity: 1.2, spread: 0.012, height: 0.7, fireColor: 'classic', bgColor: '#000000', wind: 0 } },
    { name: 'Blue Flame', params: { intensity: 0.9, spread: 0.018, height: 0.8, fireColor: 'blue', bgColor: '#000510', wind: 0.1 } },
    { name: 'Hellfire', params: { intensity: 1.4, spread: 0.01, height: 0.9, fireColor: 'purple', bgColor: '#050000', wind: -0.2 } },
  ],
  generateCode: (params, seed) => `
    let t = 0;

    function getFireColor(heat, tint) {
      if (heat <= 0) return color(0, 0, 0, 0);
      let h = min(1, heat);
      if (tint === 'classic') {
        if (h < 0.33) return color(h * 3 * 255, 0, 0, h * 3 * 255);
        if (h < 0.66) return color(255, (h - 0.33) * 3 * 255, 0, 255);
        return color(255, 255, (h - 0.66) * 3 * 255, 255);
      } else if (tint === 'blue') {
        if (h < 0.33) return color(0, 0, h * 3 * 255, h * 3 * 255);
        if (h < 0.66) return color(0, (h - 0.33) * 3 * 180, 255, 255);
        return color((h - 0.66) * 3 * 200, 200, 255, 255);
      } else if (tint === 'green') {
        if (h < 0.33) return color(0, h * 3 * 255, 0, h * 3 * 255);
        if (h < 0.66) return color((h - 0.33) * 3 * 200, 255, 0, 255);
        return color(200, 255, (h - 0.66) * 3 * 255, 255);
      } else if (tint === 'purple') {
        if (h < 0.33) return color(h * 3 * 150, 0, h * 3 * 255, h * 3 * 255);
        if (h < 0.66) return color(150 + (h-0.33)*3*105, 0, 255, 255);
        return color(255, (h - 0.66) * 3 * 200, 255, 255);
      } else {
        let v = h * 255;
        return color(v, v, v, v);
      }
    }

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      noiseSeed(${seed});
    }

    function draw() {
      background('${params.bgColor}');
      let flameH = height * ${params.height};
      let baseY = height;

      for (let x = 0; x < width; x += 4) {
        for (let y = 0; y < flameH; y += 4) {
          let distFromBase = (flameH - y) / flameH;
          let nx = (x + t * ${params.wind} * 60) * ${params.spread};
          let ny = y * ${params.spread} * 1.5 + t * 0.08;
          let n = noise(nx, ny);
          let heat = n * ${params.intensity} * distFromBase * distFromBase;
          heat = max(0, heat - (1 - distFromBase) * 0.2);

          let c = getFireColor(heat, '${params.fireColor}');
          if (alpha(c) > 5) {
            noStroke();
            fill(c);
            rect(x, baseY - y, 4, 4);
          }
        }
      }

      t += 0.04;
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
