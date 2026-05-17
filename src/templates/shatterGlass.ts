import { Template } from '../types';

export const shatterGlassTemplate: Template = {
  id: 'shatter-glass',
  name: 'Shattered Glass',
  description: 'A pane of glass that shatters into glowing shards. Click to reshatter.',
  params: [
    { id: 'shards', name: 'Shard Count', type: 'number', default: 60, min: 10, max: 200, step: 10 },
    { id: 'palette', name: 'Glass Colors', type: 'color-array', default: ['#88ccff', '#aaddff', '#cceeff', '#ffffff'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000011' },
    { id: 'edgeGlow', name: 'Edge Glow', type: 'color', default: '#00aaff' },
    { id: 'fallSpeed', name: 'Fall Speed', type: 'number', default: 2, min: 0.5, max: 8, step: 0.5 },
    { id: 'gravity', name: 'Gravity', type: 'number', default: 0.15, min: 0, max: 0.5, step: 0.01 },
    { id: 'opacity', name: 'Glass Opacity', type: 'number', default: 60, min: 10, max: 200, step: 5 },
  ],
  presets: [
    { name: 'Ice Break', params: { shards: 80, palette: ['#88ccff','#aaddff','#cceeff','#ffffff'], bgColor: '#000814', edgeGlow: '#00aaff', fallSpeed: 2, gravity: 0.12, opacity: 50 } },
    { name: 'Stained Glass', params: { shards: 50, palette: ['#ff2244','#ff8800','#ffee00','#00cc44','#0044ff','#cc00ff'], bgColor: '#000000', edgeGlow: '#ffffff', fallSpeed: 1.5, gravity: 0.1, opacity: 80 } },
    { name: 'Mirror', params: { shards: 100, palette: ['#cccccc','#dddddd','#eeeeee','#ffffff'], bgColor: '#0a0a0a', edgeGlow: '#ffffff', fallSpeed: 3, gravity: 0.2, opacity: 70 } },
  ],
  generateCode: (params, seed) => `
    let shards = [];
    let palette = ${JSON.stringify(params.palette)};

    function createShards() {
      shards = [];
      let pts = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
      for (let i = 0; i < ${params.shards}; i++) {
        pts.push({ x: random(width), y: random(height) });
      }
      // Simple random triangulation
      for (let i = 0; i < ${params.shards}; i++) {
        let cx = random(width * 0.1, width * 0.9);
        let cy = random(height * 0.1, height * 0.9);
        let n = floor(random(3, 7));
        let verts = [];
        for (let j = 0; j < n; j++) {
          let a = (TWO_PI / n) * j + random(-0.3, 0.3);
          let r = random(20, 80);
          verts.push({ x: cx + cos(a) * r, y: cy + sin(a) * r });
        }
        let angle = random(-0.5, 0.5);
        let speed = random(0.5, ${params.fallSpeed} * 1.5);
        let vx = random(-2, 2);
        let spin = random(-0.05, 0.05);
        shards.push({ verts, cx, cy, col: random(palette), angle, vy: speed * random(0.5, 2), vx, spin, falling: true });
      }
    }

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      createShards();
    }

    function draw() {
      background('${params.bgColor}');

      for (let s of shards) {
        if (s.falling) {
          s.cy += s.vy;
          s.cx += s.vx;
          s.angle += s.spin;
          s.vy += ${params.gravity};
          if (s.cy - 100 > height) s.falling = false;
        }

        push();
        translate(s.cx, s.cy);
        rotate(s.angle);

        let col = color(s.col);
        fill(red(col), green(col), blue(col), ${params.opacity});
        let gc = color('${params.edgeGlow}');
        stroke(red(gc), green(gc), blue(gc), 180);
        strokeWeight(1.5);

        beginShape();
        for (let v of s.verts) {
          vertex(v.x - s.cx, v.y - s.cy);
        }
        endShape(CLOSE);
        pop();
      }
    }

    function mousePressed() { randomSeed(millis()); createShards(); }
    function windowResized() { resizeCanvas(windowWidth, windowHeight); createShards(); }
  `,
};
