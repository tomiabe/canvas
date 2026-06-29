import { Template } from '../types';

export const pixelSortTemplate: Template = {
  id: 'pixel-sort',
  name: 'Pixel Sort',
  description: 'Glitchy pixel sorting effect on procedural gradients.',
  category: 'image',
  params: [
    { id: 'sortMode', name: 'Sort Mode', type: 'enum', default: 'horizontal', options: ['horizontal', 'vertical', 'radial', 'threshold'], category: 'image', description: 'Direction of pixel sorting' },
    { id: 'thresholdLow', name: 'Threshold Low', type: 'number', default: 30, min: 0, max: 255, step: 5, category: 'image', description: 'Lower brightness threshold' },
    { id: 'thresholdHigh', name: 'Threshold High', type: 'number', default: 220, min: 0, max: 255, step: 5, category: 'image', description: 'Upper brightness threshold' },
    { id: 'blockSize', name: 'Block Size', type: 'number', default: 4, min: 1, max: 20, step: 1, category: 'layout', description: 'Width of sort columns/rows' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff0054', '#ff6b9d', '#c77dff', '#00b4d8', '#00e5ff'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000', category: 'color' }
  ],
  presets: [
    {
      name: 'Glitch Streaks',
      params: { sortMode: 'horizontal', thresholdLow: 20, thresholdHigh: 200, blockSize: 2, palette: ['#00ff88', '#00e5ff', '#c77dff', '#ff0054'], bgColor: '#000000' }
    },
    {
      name: 'Data Corruption',
      params: { sortMode: 'radial', thresholdLow: 50, thresholdHigh: 180, blockSize: 6, palette: ['#39ff14', '#ff00ff', '#00ffff', '#ffff00'], bgColor: '#000000' }
    }
  ],
  generateCode: (params, seed) => `
    let img;
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      pixelDensity(1);
      generateGradient();
      sortPixels();
    }

    function generateGradient() {
      img = createGraphics(width, height);
      img.background('${params.bgColor}');

      // Draw colorful shapes
      img.noStroke();
      for (let i = 0; i < 15; i++) {
        let c = color(palette[i % palette.length]);
        c.setAlpha(random(100, 255));
        img.fill(c);
        let x = random(width);
        let y = random(height);
        let r = random(50, 300);
        if (random() > 0.5) img.circle(x, y, r);
        else {
          img.rectMode(CENTER);
          img.rect(x, y, r * 1.5, r);
        }
      }
      img.loadPixels();
    }

    function sortPixels() {
      img.loadPixels();
      let mode = '${params.sortMode}';
      let lo = ${params.thresholdLow};
      let hi = ${params.thresholdHigh};
      let block = ${params.blockSize};

      if (mode === 'horizontal') {
        for (let y = 0; y < height; y += block) {
          let row = [];
          for (let x = 0; x < width; x++) {
            let idx = (x + y * width) * 4;
            row.push({
              r: img.pixels[idx],
              g: img.pixels[idx + 1],
              b: img.pixels[idx + 2],
              a: img.pixels[idx + 3]
            });
          }
          sortRow(row, lo, hi);
          for (let x = 0; x < width; x++) {
            for (let by = 0; by < block && y + by < height; by++) {
              let idx = (x + (y + by) * width) * 4;
              img.pixels[idx] = row[x].r;
              img.pixels[idx + 1] = row[x].g;
              img.pixels[idx + 2] = row[x].b;
              img.pixels[idx + 3] = 255;
            }
          }
        }
      }

      else if (mode === 'vertical') {
        for (let x = 0; x < width; x += block) {
          let col = [];
          for (let y = 0; y < height; y++) {
            let idx = (x + y * width) * 4;
            col.push({
              r: img.pixels[idx],
              g: img.pixels[idx + 1],
              b: img.pixels[idx + 2],
              a: img.pixels[idx + 3]
            });
          }
          sortRow(col, lo, hi);
          for (let y = 0; y < height; y++) {
            for (let bx = 0; bx < block && x + bx < width; bx++) {
              let idx = ((x + bx) + y * width) * 4;
              img.pixels[idx] = col[y].r;
              img.pixels[idx + 1] = col[y].g;
              img.pixels[idx + 2] = col[y].b;
              img.pixels[idx + 3] = 255;
            }
          }
        }
      }

      else if (mode === 'radial') {
        let cx = width / 2, cy = height / 2;
        let maxR = dist(0, 0, cx, cy);
        let rays = [];
        for (let a = 0; a < TWO_PI; a += 0.02) {
          let ray = [];
          for (let r = 0; r < maxR; r++) {
            let x = floor(cx + cos(a) * r);
            let y = floor(cy + sin(a) * r);
            if (x >= 0 && x < width && y >= 0 && y < height) {
              let idx = (x + y * width) * 4;
              ray.push({
                r: img.pixels[idx],
                g: img.pixels[idx + 1],
                b: img.pixels[idx + 2],
                a: img.pixels[idx + 3],
                x, y
              });
            }
          }
          sortRow(ray, lo, hi);
          for (let p of ray) {
            let idx = (p.x + p.y * width) * 4;
            img.pixels[idx] = p.r;
            img.pixels[idx + 1] = p.g;
            img.pixels[idx + 2] = p.b;
          }
        }
      }

      else if (mode === 'threshold') {
        for (let y = 0; y < height; y += block) {
          for (let x = 0; x < width; x++) {
            let idx = (x + y * width) * 4;
            let bright = (img.pixels[idx] + img.pixels[idx + 1] + img.pixels[idx + 2]) / 3;
            if (bright < lo || bright > hi) {
              img.pixels[idx] = 0;
              img.pixels[idx + 1] = 0;
              img.pixels[idx + 2] = 0;
            }
          }
        }
      }

      img.updatePixels();
      image(img, 0, 0);
      noLoop();
    }

    function sortRow(row, lo, hi) {
      for (let i = 0; i < row.length; i++) {
        for (let j = i + 1; j < row.length; j++) {
          let bri = (row[i].r + row[i].g + row[i].b) / 3;
          let brj = (row[j].r + row[j].g + row[j].b) / 3;
          if (bri > lo && bri < hi && brj > lo && brj < hi && bri > brj) {
            [row[i], row[j]] = [row[j], row[i]];
          }
        }
      }
    }

    function draw() {}

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      generateGradient();
      sortPixels();
    }
  `
};
