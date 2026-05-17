import { Template } from '../types';

export const voronoiTemplate: Template = {
  id: 'voronoi',
  name: 'Voronoi Cells',
  description: 'Animated cellular Voronoi diagram with drifting seeds.',
  params: [
    { id: 'cells', name: 'Cell Count', type: 'number', default: 30, min: 5, max: 80, step: 5 },
    { id: 'speed', name: 'Drift Speed', type: 'number', default: 1.2, min: 0, max: 5, step: 0.1 },
    { id: 'palette', name: 'Colors', type: 'color-array', default: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a0a' },
    { id: 'showEdges', name: 'Show Edges', type: 'boolean', default: true },
    { id: 'edgeColor', name: 'Edge Color', type: 'color', default: '#000000' },
    { id: 'resolution', name: 'Resolution', type: 'number', default: 6, min: 2, max: 12, step: 1 },
  ],
  presets: [
    { name: 'Stained Glass', params: { cells: 25, speed: 0.5, palette: ['#e63946','#457b9d','#1d3557','#a8dadc','#f1faee'], bgColor: '#000000', showEdges: true, edgeColor: '#111111', resolution: 5 } },
    { name: 'Cells', params: { cells: 40, speed: 1.5, palette: ['#4caf50','#8bc34a','#cddc39','#ffeb3b'], bgColor: '#0a1a0a', showEdges: true, edgeColor: '#002000', resolution: 6 } },
    { name: 'Ocean', params: { cells: 20, speed: 0.8, palette: ['#03045e','#0077b6','#00b4d8','#90e0ef'], bgColor: '#000814', showEdges: false, edgeColor: '#000000', resolution: 8 } },
  ],
  generateCode: (params, seed) => `
    let pts = [];
    let palette = ${JSON.stringify(params.palette)};
    let res = ${params.resolution};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      noiseSeed(${seed});
      for (let i = 0; i < ${params.cells}; i++) {
        pts.push({
          x: random(width), y: random(height),
          vx: random(-1,1) * ${params.speed},
          vy: random(-1,1) * ${params.speed},
          col: palette[i % palette.length]
        });
      }
    }

    function draw() {
      for (let x = 0; x < width; x += res) {
        for (let y = 0; y < height; y += res) {
          let minDist = Infinity, closest = 0, secondDist = Infinity;
          for (let i = 0; i < pts.length; i++) {
            let d = dist(x, y, pts[i].x, pts[i].y);
            if (d < minDist) { secondDist = minDist; minDist = d; closest = i; }
            else if (d < secondDist) secondDist = d;
          }
          let isEdge = ${params.showEdges} && (secondDist - minDist < res * 1.5);
          noStroke();
          fill(isEdge ? '${params.edgeColor}' : pts[closest].col);
          rect(x, y, res, res);
        }
      }

      for (let p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
