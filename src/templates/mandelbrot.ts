import { Template } from '../types';

export const mandelbrotTemplate: Template = {
  id: 'mandelbrot',
  name: 'Mandelbrot Set',
  description: 'The iconic fractal — explore infinite complexity at the edge of chaos.',
  params: [
    { id: 'maxIter', name: 'Detail (Iterations)', type: 'number', default: 80, min: 20, max: 256, step: 8 },
    { id: 'zoom', name: 'Zoom', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1 },
    { id: 'centerX', name: 'Center X', type: 'number', default: -0.5, min: -2, max: 0.5, step: 0.01 },
    { id: 'centerY', name: 'Center Y', type: 'number', default: 0, min: -1.5, max: 1.5, step: 0.01 },
    { id: 'palette', name: 'Colors', type: 'enum', default: 'fire', options: ['fire', 'ocean', 'electric', 'grayscale', 'rainbow'] },
    { id: 'resolution', name: 'Resolution', type: 'number', default: 3, min: 1, max: 6, step: 1 },
  ],
  presets: [
    { name: 'Classic View', params: { maxIter: 80, zoom: 1, centerX: -0.5, centerY: 0, palette: 'fire', resolution: 3 } },
    { name: 'Deep Zoom', params: { maxIter: 200, zoom: 4, centerX: -0.75, centerY: 0.1, palette: 'electric', resolution: 4 } },
    { name: 'Seahorse Valley', params: { maxIter: 128, zoom: 3, centerX: -0.74, centerY: 0.13, palette: 'ocean', resolution: 3 } },
  ],
  generateCode: (params, seed) => `
    function setup() {
      createCanvas(windowWidth, windowHeight);
      noLoop();
      drawFractal();
    }

    function getColor(n, maxIter, palette) {
      if (n === maxIter) return color(0);
      let t = n / maxIter;
      if (palette === 'fire') {
        if (t < 0.33) return color(t*3*255, 0, 0);
        if (t < 0.66) return color(255, (t-0.33)*3*255, 0);
        return color(255, 255, (t-0.66)*3*255);
      } else if (palette === 'ocean') {
        return color(t*50, t*150, 100+t*155);
      } else if (palette === 'electric') {
        return color(t*100, t*200+55, 255);
      } else if (palette === 'rainbow') {
        colorMode(HSB, 360, 100, 100);
        let c = color(t*360, 80, 90);
        colorMode(RGB, 255, 255, 255);
        return c;
      } else {
        let v = t * 255;
        return color(v, v, v);
      }
    }

    function drawFractal() {
      let maxIter = ${params.maxIter};
      let zoom = ${params.zoom};
      let cx = ${params.centerX};
      let cy = ${params.centerY};
      let res = ${params.resolution};
      let scale = 3.5 / (min(width, height) * zoom);

      for (let px = 0; px < width; px += res) {
        for (let py = 0; py < height; py += res) {
          let x0 = (px - width/2) * scale + cx;
          let y0 = (py - height/2) * scale + cy;
          let x = 0, y = 0, n = 0;
          while (x*x + y*y <= 4 && n < maxIter) {
            let xNew = x*x - y*y + x0;
            y = 2*x*y + y0;
            x = xNew;
            n++;
          }
          fill(getColor(n, maxIter, '${params.palette}'));
          noStroke();
          rect(px, py, res, res);
        }
      }
    }

    function mousePressed() { drawFractal(); }
    function windowResized() { resizeCanvas(windowWidth, windowHeight); drawFractal(); }
  `,
};
