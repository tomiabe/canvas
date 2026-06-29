import { Template } from '../types';

export const terrainTemplate: Template = {
  id: 'terrain',
  name: '3D Terrain (WEBGL)',
  description: 'Procedural 3D terrain generated from Perlin noise, rendered in WebGL.',
  category: '3d',
  params: [
    { id: 'scale', name: 'Noise Scale', type: 'number', default: 0.03, min: 0.005, max: 0.1, step: 0.005, category: 'noise', description: 'Detail level of the noise' },
    { id: 'heightScale', name: 'Height Scale', type: 'number', default: 150, min: 20, max: 400, step: 10, category: '3d', suffix: 'px', description: 'Maximum height of terrain peaks' },
    { id: 'resolution', name: 'Resolution', type: 'number', default: 20, min: 5, max: 50, step: 5, category: 'layout', description: 'Grid resolution (lower = more detail)' },
    { id: 'speed', name: 'Animate Speed', type: 'number', default: 0.01, min: 0, max: 0.05, step: 0.002, category: 'animation', description: 'How fast the terrain warps over time' },
    { id: 'rotationSpeed', name: 'Rotate Speed', type: 'number', default: 0.002, min: 0, max: 0.02, step: 0.001, category: 'animation', description: 'Auto-rotation speed' },
    { id: 'landColor', name: 'Land Color', type: 'color', default: '#2d5016', category: 'color', description: 'Color of low terrain' },
    { id: 'peakColor', name: 'Peak Color', type: 'color', default: '#ffffff', category: 'color', description: 'Color of high terrain' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a1a', category: 'color' }
  ],
  presets: [
    {
      name: 'Alpine',
      params: { scale: 0.02, heightScale: 300, resolution: 15, speed: 0.005, rotationSpeed: 0.003, landColor: '#3a5a40', peakColor: '#ffffff', bgColor: '#1a1a2e' }
    },
    {
      name: 'Desert Dunes',
      params: { scale: 0.04, heightScale: 80, resolution: 30, speed: 0, rotationSpeed: 0.002, landColor: '#d4a373', peakColor: '#faedcd', bgColor: '#264653' }
    }
  ],
  generateCode: (params, seed) => `
    let terrain = [];
    let fly = 0;

    function setup() {
      createCanvas(windowWidth, windowHeight, WEBGL);
      noStroke();
    }

    function draw() {
      background('${params.bgColor}');

      let cols = floor(width / ${params.resolution});
      let rows = floor(height / ${params.resolution});

      rotateX(PI / 3);
      rotateZ(frameCount * ${params.rotationSpeed});
      translate(-width / 2, -height / 2);

      fly -= ${params.speed};
      let yOff = fly;

      terrain = [];
      for (let y = 0; y < rows; y++) {
        let xOff = 0;
        terrain[y] = [];
        for (let x = 0; x < cols; x++) {
          terrain[y][x] = map(noise(xOff, yOff), 0, 1, -${params.heightScale}, ${params.heightScale});
          xOff += ${params.scale};
        }
        yOff += ${params.scale};
      }

      let land = color('${params.landColor}');
      let peak = color('${params.peakColor}');

      for (let y = 0; y < rows - 1; y++) {
        beginShape(TRIANGLE_STRIP);
        for (let x = 0; x < cols; x++) {
          let h1 = terrain[y][x];
          let h2 = terrain[y + 1][x];
          let amt1 = norm(h1, -${params.heightScale}, ${params.heightScale});
          let amt2 = norm(h2, -${params.heightScale}, ${params.heightScale});
          fill(lerpColor(land, peak, amt1));
          vertex(x * ${params.resolution}, y * ${params.resolution}, h1);
          fill(lerpColor(land, peak, amt2));
          vertex(x * ${params.resolution}, (y + 1) * ${params.resolution}, h2);
        }
        endShape();
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
