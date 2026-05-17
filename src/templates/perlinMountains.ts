import { Template } from '../types';

export const perlinMountainsTemplate: Template = {
  id: 'perlin-mountains',
  name: 'Perlin Mountains',
  description: 'Layered mountain ranges emerging from Perlin noise — a generative landscape.',
  params: [
    { id: 'layers', name: 'Mountain Layers', type: 'number', default: 5, min: 2, max: 10, step: 1 },
    { id: 'roughness', name: 'Roughness', type: 'number', default: 0.015, min: 0.003, max: 0.05, step: 0.001 },
    { id: 'height', name: 'Peak Height', type: 'number', default: 0.5, min: 0.1, max: 0.8, step: 0.05 },
    { id: 'speed', name: 'Scroll Speed', type: 'number', default: 0.002, min: 0, max: 0.015, step: 0.001 },
    { id: 'palette', name: 'Layer Colors', type: 'color-array', default: ['#2d3a4a', '#3d4f63', '#4a6277', '#607d8b', '#90a4ae', '#eceff1'] },
    { id: 'bgColor', name: 'Sky Color', type: 'color', default: '#0d1b2a' },
    { id: 'skyGlow', name: 'Horizon Glow', type: 'color', default: '#ff6b35' },
  ],
  presets: [
    { name: 'Dusk', params: { layers: 6, roughness: 0.012, height: 0.55, speed: 0.002, palette: ['#1a0a30','#2d1654','#4a2070','#7b3fa0','#c06090','#e8a0b0'], bgColor: '#0d0520', skyGlow: '#ff4488', } },
    { name: 'Daybreak', params: { layers: 5, roughness: 0.018, height: 0.45, speed: 0.003, palette: ['#1a3a2a','#2a5a40','#3a7a55','#6aa070','#a0c8a0'], bgColor: '#0a1520', skyGlow: '#ffa040', } },
    { name: 'Arctic', params: { layers: 4, roughness: 0.01, height: 0.6, speed: 0.001, palette: ['#1a2a40','#2a4060','#4a6080','#80a0c0','#c0d8f0'], bgColor: '#000a20', skyGlow: '#88aaff', } },
  ],
  generateCode: (params, seed) => `
    let t = 0;
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      noiseSeed(${seed});
    }

    function draw() {
      // Sky gradient
      for (let y = 0; y < height; y++) {
        let tc = lerpColor(color('${params.bgColor}'), color('${params.skyGlow}'), pow(1 - y/height, 3));
        stroke(tc);
        line(0, y, width, y);
      }

      let layers = min(${params.layers}, palette.length);
      for (let l = layers - 1; l >= 0; l--) {
        let col = color(palette[l % palette.length]);
        let yBase = map(l, 0, layers - 1, height * 0.35, height * 0.85);
        let amp = height * ${params.height} * (1 - l * 0.1 / layers);
        let roughness = ${params.roughness} * (1 + l * 0.3);

        fill(col);
        noStroke();
        beginShape();
        vertex(0, height);
        for (let x = 0; x <= width; x += 3) {
          let n = noise(x * roughness + l * 5 + t, l * 2);
          let y = yBase - n * amp;
          vertex(x, y);
        }
        vertex(width, height);
        endShape(CLOSE);
      }

      t += ${params.speed};
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
