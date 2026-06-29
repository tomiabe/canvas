import { Template } from '../types';

export const gradientMeshTemplate: Template = {
  id: 'gradient-mesh',
  name: 'Gradient Mesh',
  description: 'Smooth color gradient mesh with animated control points.',
  category: 'color',
  params: [
    { id: 'resolution', name: 'Mesh Resolution', type: 'number', default: 4, min: 2, max: 10, step: 1, category: 'layout', description: 'Grid divisions (higher = more detail)' },
    { id: 'speed', name: 'Animation Speed', type: 'number', default: 0.005, min: 0, max: 0.02, step: 0.001, category: 'animation', description: 'How fast control points move' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff0054', '#ff6b9d', '#c77dff', '#00b4d8', '#00e5ff', '#39ff14'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000', category: 'color' }
  ],
  presets: [
    {
      name: 'Aurora Mesh',
      params: { resolution: 6, speed: 0.008, palette: ['#00ff87', '#60efff', '#0066ff', '#a020f0', '#ff0099'], bgColor: '#000000' }
    },
    {
      name: 'Oil Spill',
      params: { resolution: 3, speed: 0.002, palette: ['#2d00f7', '#ff007f', '#ffea00', '#00ff41', '#00f0ff'], bgColor: '#000000' }
    }
  ],
  generateCode: (params, seed) => `
    let cols, rows;
    let controlPoints = [];
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      pixelDensity(1);
      cols = ${params.resolution};
      rows = ${params.resolution};

      for (let j = 0; j <= rows; j++) {
        controlPoints[j] = [];
        for (let i = 0; i <= cols; i++) {
          controlPoints[j][i] = {
            x: (i / cols) * width,
            y: (j / rows) * height,
            offsetX: random(-30, 30),
            offsetY: random(-30, 30),
            phaseX: random(TWO_PI),
            phaseY: random(TWO_PI),
            color: random(palette)
          };
        }
      }
    }

    function draw() {
      loadPixels();

      let speed = ${params.speed};
      let t = frameCount * speed;

      for (let j = 0; j <= rows; j++) {
        for (let i = 0; i <= cols; i++) {
          let cp = controlPoints[j][i];
          cp.x = (i / cols) * width + sin(t + cp.phaseX) * cp.offsetX;
          cp.y = (j / rows) * height + cos(t + cp.phaseY) * cp.offsetY;
        }
      }

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          let u = (x / width) * cols;
          let v = (y / height) * rows;
          let ui = floor(u);
          let vi = floor(v);
          let uf = u - ui;
          let vf = v - vi;
          let i1 = min(ui, cols);
          let i2 = min(ui + 1, cols);
          let j1 = min(vi, rows);
          let j2 = min(vi + 1, rows);

          let c00 = color(controlPoints[j1][i1].color);
          let c10 = color(controlPoints[j1][i2].color);
          let c01 = color(controlPoints[j2][i1].color);
          let c11 = color(controlPoints[j2][i2].color);

          let top = lerpColor(c00, c10, uf);
          let bottom = lerpColor(c01, c11, uf);
          let col = lerpColor(top, bottom, vf);

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
