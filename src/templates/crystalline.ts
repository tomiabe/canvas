import { Template } from '../types';

export const crystallineTemplate: Template = {
  id: 'crystalline',
  name: 'Crystal Growth',
  description: 'Crystals nucleate and grow outward in fractal branching patterns.',
  params: [
    { id: 'seeds', name: 'Crystal Seeds', type: 'number', default: 5, min: 1, max: 15, step: 1 },
    { id: 'branches', name: 'Branch Count', type: 'number', default: 6, min: 3, max: 12, step: 1 },
    { id: 'depth', name: 'Growth Depth', type: 'number', default: 6, min: 3, max: 10, step: 1 },
    { id: 'palette', name: 'Crystal Colors', type: 'color-array', default: ['#a8daff', '#48cae4', '#0096c7', '#0077b6', '#023e8a'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000814' },
    { id: 'glow', name: 'Crystal Glow', type: 'boolean', default: true },
    { id: 'speed', name: 'Growth Speed', type: 'number', default: 1, min: 0.3, max: 5, step: 0.1 },
  ],
  presets: [
    { name: 'Ice Crystal', params: { seeds: 3, branches: 6, depth: 7, palette: ['#caf0f8','#90e0ef','#00b4d8','#0096c7'], bgColor: '#000814', glow: true, speed: 1 } },
    { name: 'Amethyst', params: { seeds: 6, branches: 4, depth: 6, palette: ['#e040fb','#ab47bc','#7b1fa2','#4a148c'], bgColor: '#0d001a', glow: true, speed: 1.5 } },
    { name: 'Snowflake', params: { seeds: 1, branches: 6, depth: 8, palette: ['#ffffff','#d0e8ff','#a8d0ff'], bgColor: '#000c1a', glow: false, speed: 0.5 } },
  ],
  generateCode: (params, seed) => `
    let crystals = [];
    let palette = ${JSON.stringify(params.palette)};
    let growing = true;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      background('${params.bgColor}');
      spawnCrystals();
    }

    function spawnCrystals() {
      crystals = [];
      for (let i = 0; i < ${params.seeds}; i++) {
        crystals.push({
          x: random(width * 0.2, width * 0.8),
          y: random(height * 0.2, height * 0.8),
          branches: [],
          col: palette[i % palette.length],
          grown: false,
        });
      }
      for (let c of crystals) {
        for (let b = 0; b < ${params.branches}; b++) {
          c.branches.push({
            angle: (TWO_PI / ${params.branches}) * b + random(-0.2, 0.2),
            len: 0, maxLen: random(40, min(width, height) * 0.35),
            depth: 0, children: [],
          });
        }
      }
    }

    function growBranch(branch, x, y, col) {
      let growRate = 2 * ${params.speed};
      branch.len = min(branch.len + growRate, branch.maxLen);
      let ex = x + cos(branch.angle) * branch.len;
      let ey = y + sin(branch.angle) * branch.len;

      let c = color(col);
      let alpha = map(branch.depth, 0, ${params.depth}, 200, 60);
      let w = map(branch.depth, 0, ${params.depth}, 2.5, 0.5);

      if (${params.glow}) {
        stroke(red(c), green(c), blue(c), alpha * 0.3);
        strokeWeight(w * 3);
        line(x, y, ex, ey);
      }
      stroke(red(c), green(c), blue(c), alpha);
      strokeWeight(w);
      line(x, y, ex, ey);

      if (branch.len >= branch.maxLen * 0.4 && branch.depth < ${params.depth} && branch.children.length === 0) {
        for (let s = -1; s <= 1; s += 2) {
          branch.children.push({
            angle: branch.angle + s * radians(random(20, 50)),
            len: 0, maxLen: branch.maxLen * random(0.4, 0.65),
            depth: branch.depth + 1, children: [],
          });
        }
      }

      let midX = x + cos(branch.angle) * branch.len;
      let midY = y + sin(branch.angle) * branch.len;
      for (let child of branch.children) growBranch(child, midX, midY, col);
    }

    function isFullyGrown(branch) {
      if (branch.len < branch.maxLen) return false;
      for (let c of branch.children) if (!isFullyGrown(c)) return false;
      return true;
    }

    function draw() {
      background('${params.bgColor}');
      growing = false;
      for (let cr of crystals) {
        for (let b of cr.branches) {
          growBranch(b, cr.x, cr.y, cr.col);
          if (!isFullyGrown(b)) growing = true;
        }
        noStroke();
        fill(cr.col);
        circle(cr.x, cr.y, 8);
      }
      if (!growing) noLoop();
    }

    function mousePressed() { background('${params.bgColor}'); loop(); spawnCrystals(); }
    function windowResized() { resizeCanvas(windowWidth, windowHeight); background('${params.bgColor}'); loop(); spawnCrystals(); }
  `,
};
