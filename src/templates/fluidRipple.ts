import { Template } from '../types';

export const fluidRippleTemplate: Template = {
  id: 'fluid-ripple',
  name: 'Fluid Ripple',
  description: '2D water ripple simulation using wave propagation algorithm.',
  category: 'simulation',
  params: [
    { id: 'damping', name: 'Damping', type: 'number', default: 0.96, min: 0.9, max: 0.995, step: 0.005, category: 'simulation', description: 'How quickly ripples fade' },
    { id: 'resolution', name: 'Resolution', type: 'number', default: 6, min: 2, max: 15, step: 1, category: 'layout', description: 'Grid resolution (lower = smoother)' },
    { id: 'dropForce', name: 'Drop Force', type: 'number', default: 500, min: 100, max: 2000, step: 100, category: 'simulation', description: 'Strength of mouse drops' },
    { id: 'color1', name: 'Color A', type: 'color', default: '#00b4d8', category: 'color' },
    { id: 'color2', name: 'Color B', type: 'color', default: '#03045e', category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000', category: 'color' }
  ],
  presets: [
    {
      name: 'Raindrops',
      params: { damping: 0.97, resolution: 4, dropForce: 800, color1: '#00e5ff', color2: '#0077b6', bgColor: '#000000' }
    },
    {
      name: 'Oil Slick',
      params: { damping: 0.99, resolution: 8, dropForce: 300, color1: '#c77dff', color2: '#ff6b9d', bgColor: '#0a0a0a' }
    }
  ],
  generateCode: (params, seed) => `
    let cols, rows;
    let current, previous;
    let res = ${params.resolution};
    let damp = ${params.damping};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      pixelDensity(1);
      cols = ceil(width / res) + 1;
      rows = ceil(height / res) + 1;
      current = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
      previous = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
    }

    function mouseDragged() {
      let ix = floor(mouseX / res);
      let iy = floor(mouseY / res);
      if (ix > 0 && ix < cols - 1 && iy > 0 && iy < rows - 1) {
        previous[ix][iy] = ${params.dropForce};
      }
    }

    function draw() {
      loadPixels();

      for (let x = 1; x < cols - 1; x++) {
        for (let y = 1; y < rows - 1; y++) {
          current[x][y] = (
            previous[x - 1][y] + previous[x + 1][y] +
            previous[x][y - 1] + previous[x][y + 1]
          ) / 2 - current[x][y];
          current[x][y] *= damp;
        }
      }

      let c1 = color('${params.color1}');
      let c2 = color('${params.color2}');

      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          let val = current[x][y];
          let norm = constrain(val / 255, -1, 1);
          let t = map(norm, -1, 1, 0, 1);
          let col = lerpColor(c2, c1, t);

          for (let px = 0; px < res; px++) {
            for (let py = 0; py < res; py++) {
              let ix = (x * res + px + y * res * width + py * width) * 4;
              if (ix < pixels.length) {
                pixels[ix] = red(col);
                pixels[ix + 1] = green(col);
                pixels[ix + 2] = blue(col);
                pixels[ix + 3] = 255;
              }
            }
          }
        }
      }
      updatePixels();

      // Swap buffers
      let temp = previous;
      previous = current;
      current = temp;

      // Random drops
      if (random(100) < 2) {
        let ix = floor(random(1, cols - 1));
        let iy = floor(random(1, rows - 1));
        previous[ix][iy] = random(200, ${params.dropForce});
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
