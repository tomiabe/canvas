import { Template } from '../types';

export const orbitsTemplate: Template = {
  id: 'orbits',
  name: 'Orbital System',
  description: 'Planets orbiting under gravity with beautiful trailing paths.',
  params: [
    { id: 'bodies', name: 'Orbiting Bodies', type: 'number', default: 5, min: 2, max: 10, step: 1 },
    { id: 'trailLen', name: 'Trail Length', type: 'number', default: 150, min: 10, max: 500, step: 10 },
    { id: 'speed', name: 'Orbital Speed', type: 'number', default: 1, min: 0.1, max: 4, step: 0.1 },
    { id: 'palette', name: 'Planet Colors', type: 'color-array', default: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#1dd1a1'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000' },
    { id: 'starColor', name: 'Star Color', type: 'color', default: '#ffee88' },
    { id: 'showTrails', name: 'Show Trails', type: 'boolean', default: true },
  ],
  presets: [
    { name: 'Solar System', params: { bodies: 6, trailLen: 200, speed: 1, palette: ['#ff6b6b','#feca57','#48dbfb','#1dd1a1','#ff9ff3','#54a0ff'], bgColor: '#000000', starColor: '#ffee88', showTrails: true } },
    { name: 'Binary Stars', params: { bodies: 3, trailLen: 300, speed: 1.5, palette: ['#ff4400','#0044ff','#ffffff'], bgColor: '#000011', starColor: '#ffffff', showTrails: true } },
    { name: 'Chaotic', params: { bodies: 8, trailLen: 80, speed: 2.5, palette: ['#ff0000','#ff7700','#ffff00','#00ff00','#0000ff','#ff00ff','#00ffff','#ffffff'], bgColor: '#050005', starColor: '#ffffff', showTrails: false } },
  ],
  generateCode: (params, seed) => `
    let bodies = [];
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      initBodies();
    }

    function initBodies() {
      bodies = [];
      let center = { x: width/2, y: height/2 };
      for (let i = 0; i < ${params.bodies}; i++) {
        let a = (TWO_PI / ${params.bodies}) * i + random(-0.3, 0.3);
        let r = random(80, min(width, height) * 0.42);
        let speed = sqrt(0.4 / r) * ${params.speed} * 60;
        bodies.push({
          x: center.x + cos(a) * r,
          y: center.y + sin(a) * r,
          vx: -sin(a) * speed,
          vy: cos(a) * speed,
          mass: random(3, 10),
          col: palette[i % palette.length],
          trail: [],
        });
      }
    }

    function draw() {
      background('${params.bgColor}');

      // Draw star (sun)
      noStroke();
      fill('${params.starColor}');
      let glow = sin(frameCount * 0.05) * 3;
      circle(width/2, height/2, 20 + glow);
      fill(red(color('${params.starColor}')), green(color('${params.starColor}')), blue(color('${params.starColor}')), 40);
      circle(width/2, height/2, 40 + glow * 2);

      for (let b of bodies) {
        let dx = width/2 - b.x, dy = height/2 - b.y;
        let d = max(20, sqrt(dx*dx + dy*dy));
        let force = 4000 / (d * d);
        b.vx += (dx / d) * force * 0.016;
        b.vy += (dy / d) * force * 0.016;
        b.x += b.vx * 0.016;
        b.y += b.vy * 0.016;

        if (${params.showTrails}) {
          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > ${params.trailLen}) b.trail.shift();
          for (let j = 1; j < b.trail.length; j++) {
            let a = map(j, 0, b.trail.length, 0, 150);
            stroke(color(b.col + Math.round(a).toString(16).padStart(2, '0')));
            strokeWeight(map(j, 0, b.trail.length, 0.3, 2));
            let col = color(b.col);
            stroke(red(col), green(col), blue(col), a);
            line(b.trail[j-1].x, b.trail[j-1].y, b.trail[j].x, b.trail[j].y);
          }
        }

        noStroke();
        fill(b.col);
        circle(b.x, b.y, b.mass * 2);
      }
    }

    function mousePressed() { initBodies(); }
    function windowResized() { resizeCanvas(windowWidth, windowHeight); initBodies(); }
  `,
};
