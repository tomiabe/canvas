import { Template } from '../types';

export const ditheringTemplate: Template = {
  id: 'dithering',
  name: 'Dithering',
  description: 'Floyd-Steinberg error diffusion dithering on procedural patterns.',
  category: 'image',
  params: [
    { id: 'pattern', name: 'Pattern', type: 'enum', default: 'gradient', options: ['gradient', 'circles', 'portrait', 'noise'], category: 'image', description: 'Source pattern to dither' },
    { id: 'threshold', name: 'Threshold', type: 'number', default: 128, min: 16, max: 240, step: 8, category: 'image', description: 'Dithering threshold' },
    { id: 'dotSize', name: 'Dot Size', type: 'number', default: 4, min: 1, max: 12, step: 1, category: 'layout', suffix: 'px', description: 'Size of each dither dot' },
    { id: 'color1', name: 'Color 1', type: 'color', default: '#ffffff', category: 'color' },
    { id: 'color2', name: 'Color 2', type: 'color', default: '#000000', category: 'color' }
  ],
  presets: [
    {
      name: 'Newsprint',
      params: { pattern: 'gradient', threshold: 128, dotSize: 3, color1: '#000000', color2: '#ffffff' }
    },
    {
      name: 'Stippled Circles',
      params: { pattern: 'circles', threshold: 100, dotSize: 5, color1: '#1a1a2e', color2: '#e94560' }
    }
  ],
  generateCode: (params, seed) => `
    let img;
    let res = ${params.dotSize};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      noStroke();
      generatePattern();
    }

    function generatePattern() {
      let g = createGraphics(width, height);
      let pattern = '${params.pattern}';

      if (pattern === 'gradient') {
        for (let x = 0; x < width; x++) {
          let c = map(x, 0, width, 0, 255);
          g.stroke(c);
          g.line(x, 0, x, height);
        }
      } else if (pattern === 'circles') {
        g.background(0);
        g.noFill();
        for (let i = 0; i < 30; i++) {
          let r = random(50, 300);
          let x = random(width);
          let y = random(height);
          g.stroke(random(255));
          g.strokeWeight(random(1, 5));
          g.circle(x, y, r);
        }
      } else if (pattern === 'noise') {
        g.loadPixels();
        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            let n = noise(x * 0.01, y * 0.01) * 255;
            let idx = (x + y * width) * 4;
            g.pixels[idx] = n;
            g.pixels[idx + 1] = n;
            g.pixels[idx + 2] = n;
            g.pixels[idx + 3] = 255;
          }
        }
        g.updatePixels();
      } else {
        g.background(255);
        g.fill(0);
        g.textAlign(CENTER, CENTER);
        g.textSize(200);
        g.text('8-BIT', width/2, height/2);
      }

      img = g.get();
      applyDither();
    }

    function applyDither() {
      img.loadPixels();
      let threshold = ${params.threshold};
      let c1 = color('${params.color1}');
      let c2 = color('${params.color2}');

      for (let y = 0; y < height; y += res) {
        for (let x = 0; x < width; x += res) {
          let idx = (x + y * width) * 4;
          let oldR = img.pixels[idx];
          let oldG = img.pixels[idx + 1];
          let oldB = img.pixels[idx + 2];
          let gray = (oldR + oldG + oldB) / 3;
          let newVal = gray > threshold ? 255 : 0;
          let err = gray - newVal;

          fill(newVal > threshold ? c1 : c2);
          rect(x, y, res, res);

          // Diffuse error
          if (x + res < width) {
            let eIdx = ((x + res) + y * width) * 4;
            img.pixels[eIdx] = constrain(img.pixels[eIdx] + err * 7 / 16, 0, 255);
          }
          if (y + res < height) {
            if (x > 0) {
              let eIdx = ((x - res) + (y + res) * width) * 4;
              img.pixels[eIdx] = constrain(img.pixels[eIdx] + err * 3 / 16, 0, 255);
            }
            let eIdx = (x + (y + res) * width) * 4;
            img.pixels[eIdx] = constrain(img.pixels[eIdx] + err * 5 / 16, 0, 255);
            if (x + res < width) {
              let eIdx = ((x + res) + (y + res) * width) * 4;
              img.pixels[eIdx] = constrain(img.pixels[eIdx] + err * 1 / 16, 0, 255);
            }
          }
        }
      }
      noLoop();
    }

    function draw() {}

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      generatePattern();
    }
  `
};
