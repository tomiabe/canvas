import { Template } from '../types';

export const metaballsTemplate: Template = {
  id: 'metaballs',
  name: 'Meta-balls',
  description: 'Organic blob-like isosurfaces using marching squares.',
  category: 'geometry',
  params: [
    { id: 'count', name: 'Blob Count', type: 'number', default: 6, min: 2, max: 20, step: 1, category: 'geometry', description: 'Number of blobs' },
    { id: 'threshold', name: 'Threshold', type: 'number', default: 150, min: 50, max: 255, step: 5, category: 'simulation', description: 'Isosurface threshold value' },
    { id: 'speed', name: 'Movement Speed', type: 'number', default: 1, min: 0.1, max: 4, step: 0.1, category: 'animation', description: 'How fast blobs move around' },
    { id: 'resolution', name: 'Resolution', type: 'number', default: 4, min: 1, max: 12, step: 1, category: 'layout', description: 'Pixel sampling resolution' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff0054', '#ff6b9d', '#c77dff', '#00b4d8'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a0a', category: 'color' }
  ],
  presets: [
    {
      name: 'Neon Goo',
      params: { count: 10, threshold: 180, speed: 0.5, resolution: 2, palette: ['#39ff14', '#00ff88', '#00ffff', '#ff00ff'], bgColor: '#000000' }
    },
    {
      name: 'Lava Lamp',
      params: { count: 4, threshold: 200, speed: 0.3, resolution: 3, palette: ['#ff4500', '#ff6347', '#ff8c00', '#ffd700'], bgColor: '#1a0000' }
    }
  ],
  generateCode: (params, seed) => `
    let blobs = [];
    let palette = ${JSON.stringify(params.palette)};
    let res = ${params.resolution};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      pixelDensity(1);
      for (let i = 0; i < ${params.count}; i++) {
        blobs.push({
          x: random(width),
          y: random(height),
          vx: random(-1, 1),
          vy: random(-1, 1),
          r: random(80, 200),
          color: random(palette)
        });
      }
    }

    function draw() {
      loadPixels();

      for (let b of blobs) {
        b.x += b.vx * ${params.speed};
        b.y += b.vy * ${params.speed};
        if (b.x < 0 || b.x > width) b.vx *= -1;
        if (b.y < 0 || b.y > height) b.vy *= -1;
      }

      for (let x = 0; x < width; x += res) {
        for (let y = 0; y < height; y += res) {
          let sum = 0;
          for (let b of blobs) {
            let d = dist(x, y, b.x, b.y);
            sum += (b.r * b.r) / (d * d);
          }
          sum = sum * 255;

          let idx = (x + y * width) * 4;
          if (sum > ${params.threshold}) {
            // Blend colors from nearest blob
            let nearest = blobs[0];
            let nearDist = dist(x, y, blobs[0].x, blobs[0].y);
            for (let b of blobs) {
              let d = dist(x, y, b.x, b.y);
              if (d < nearDist) { nearDist = d; nearest = b; }
            }
            let c = color(nearest.color);
            pixels[idx] = red(c);
            pixels[idx + 1] = green(c);
            pixels[idx + 2] = blue(c);
            pixels[idx + 3] = 255;
          } else {
            let bg = color('${params.bgColor}');
            pixels[idx] = red(bg);
            pixels[idx + 1] = green(bg);
            pixels[idx + 2] = blue(bg);
            pixels[idx + 3] = 255;
          }
        }
      }
      updatePixels();
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
