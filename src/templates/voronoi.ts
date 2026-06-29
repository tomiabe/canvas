import { Template } from '../types';

export const voronoiTemplate: Template = {
  id: 'voronoi',
  name: 'Voronoi Diagram',
  description: 'Voronoi tessellation with animated site points and colored cells.',
  category: 'geometry',
  params: [
    { id: 'siteCount', name: 'Site Count', type: 'number', default: 40, min: 5, max: 150, step: 5, category: 'geometry', description: 'Number of Voronoi seed points' },
    { id: 'jitter', name: 'Jitter', type: 'number', default: 0.5, min: 0, max: 2, step: 0.1, category: 'noise', description: 'Amount of site point movement per frame' },
    { id: 'showSites', name: 'Show Sites', type: 'boolean', default: true, category: 'geometry', description: 'Display seed points' },
    { id: 'relaxIterations', name: 'Relaxation', type: 'number', default: 0, min: 0, max: 5, step: 1, category: 'simulation', description: 'Lloyd relaxation iterations (0 = none)' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff', '#ff6b9d'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a1a', category: 'color' }
  ],
  presets: [
    { name: 'Organic Cells', params: { siteCount: 60, jitter: 0.3, showSites: false, relaxIterations: 2 } },
    { name: 'Dense Packing', params: { siteCount: 120, jitter: 0.8, showSites: false, relaxIterations: 0 } },
    { name: 'With Seed Points', params: { siteCount: 30, jitter: 0, showSites: true, relaxIterations: 3 } },
  ],
  generateCode: (params, seed) => `
    let sites = [];
    let palette = ${JSON.stringify(params.palette)};
    let bgColor = '${params.bgColor}';
    let jitter = ${params.jitter};
    let showSites = ${params.showSites};
    let relaxIters = ${params.relaxIterations};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      initSites();
      for (let i = 0; i < relaxIters; i++) relaxSites();
    }

    function initSites() {
      sites = [];
      for (let i = 0; i < ${params.siteCount}; i++) {
        sites.push({
          x: random(width),
          y: random(height),
          vx: random(-jitter, jitter),
          vy: random(-jitter, jitter)
        });
      }
    }

    function relaxSites() {
      let colors = new Array(sites.length).fill(0);
      let sums = sites.map(() => ({ x: 0, y: 0, count: 0 }));

      for (let x = 0; x < width; x += 4) {
        for (let y = 0; y < height; y += 4) {
          let minD = Infinity;
          let minI = 0;
          for (let i = 0; i < sites.length; i++) {
            let d = dist(x, y, sites[i].x, sites[i].y);
            if (d < minD) { minD = d; minI = i; }
          }
          sums[minI].x += x;
          sums[minI].y += y;
          sums[minI].count++;
        }
      }

      for (let i = 0; i < sites.length; i++) {
        if (sums[i].count > 0) {
          sites[i].x = sums[i].x / sums[i].count;
          sites[i].y = sums[i].y / sums[i].count;
        }
      }
    }

    function draw() {
      background(bgColor);

      if (jitter > 0) {
        for (let s of sites) {
          s.x += random(-jitter, jitter);
          s.y += random(-jitter, jitter);
          s.x = constrain(s.x, 0, width);
          s.y = constrain(s.y, 0, height);
        }
      }

      loadPixels();
      for (let x = 0; x < width; x += 2) {
        for (let y = 0; y < height; y += 2) {
          let minD = Infinity;
          let minI = 0;
          for (let i = 0; i < sites.length; i++) {
            let d = dist(x, y, sites[i].x, sites[i].y);
            if (d < minD) { minD = d; minI = i; }
          }
          let c = color(palette[minI % palette.length]);
          for (let px = 0; px < 2; px++) {
            for (let py = 0; py < 2; py++) {
              let idx = ((x + px) + (y + py) * width) * 4;
              if (idx < pixels.length) {
                pixels[idx] = red(c);
                pixels[idx + 1] = green(c);
                pixels[idx + 2] = blue(c);
                pixels[idx + 3] = 255;
              }
            }
          }
        }
      }
      updatePixels();

      if (showSites) {
        fill(255);
        noStroke();
        for (let s of sites) {
          circle(s.x, s.y, 5);
        }
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      initSites();
      for (let i = 0; i < relaxIters; i++) relaxSites();
    }
  `,
};
