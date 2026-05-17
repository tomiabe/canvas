import { Template } from '../types';

export const bouncingBallsTemplate: Template = {
  id: 'bouncing-balls',
  name: 'Physics Balls',
  description: 'Colorful balls bouncing with gravity, elasticity, and collisions.',
  params: [
    { id: 'count', name: 'Ball Count', type: 'number', default: 25, min: 3, max: 80, step: 1 },
    { id: 'gravity', name: 'Gravity', type: 'number', default: 0.4, min: 0, max: 1.5, step: 0.05 },
    { id: 'bounce', name: 'Bounciness', type: 'number', default: 0.8, min: 0.2, max: 1.0, step: 0.05 },
    { id: 'friction', name: 'Friction', type: 'number', default: 0.98, min: 0.9, max: 1.0, step: 0.005 },
    { id: 'palette', name: 'Ball Colors', type: 'color-array', default: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#1dd1a1'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0d0d0d' },
    { id: 'trails', name: 'Motion Blur', type: 'boolean', default: false },
  ],
  presets: [
    { name: 'Bouncy', params: { count: 20, gravity: 0.5, bounce: 0.92, friction: 0.99, palette: ['#ff6b6b','#feca57','#48dbfb','#ff9ff3'], bgColor: '#111111', trails: false } },
    { name: 'Zero-G', params: { count: 40, gravity: 0, bounce: 1.0, friction: 1.0, palette: ['#00ffcc','#ff00cc','#ffcc00','#0099ff'], bgColor: '#000000', trails: true } },
    { name: 'Heavy', params: { count: 15, gravity: 1.2, bounce: 0.5, friction: 0.95, palette: ['#555555','#888888','#bbbbbb','#ffffff'], bgColor: '#0a0a0a', trails: false } },
  ],
  generateCode: (params, seed) => `
    let balls = [];
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      for (let i = 0; i < ${params.count}; i++) {
        let r = random(10, 35);
        balls.push({
          x: random(r, width - r),
          y: random(r, height/2),
          vx: random(-4, 4),
          vy: random(-2, 2),
          r,
          col: palette[i % palette.length],
          trail: [],
        });
      }
    }

    function draw() {
      if (${params.trails}) {
        background(0, 0, 0, 30);
      } else {
        background('${params.bgColor}');
      }

      for (let b of balls) {
        b.vy += ${params.gravity};
        b.vx *= ${params.friction};
        b.vy *= ${params.friction};
        b.x += b.vx;
        b.y += b.vy;

        if (b.x - b.r < 0) { b.x = b.r; b.vx *= -${params.bounce}; }
        if (b.x + b.r > width) { b.x = width - b.r; b.vx *= -${params.bounce}; }
        if (b.y - b.r < 0) { b.y = b.r; b.vy *= -${params.bounce}; }
        if (b.y + b.r > height) { b.y = height - b.r; b.vy *= -${params.bounce}; }

        // Shadow
        noStroke();
        fill(0, 0, 0, 60);
        ellipse(b.x + 3, b.y + 4, b.r * 2, b.r * 1.2);

        // Ball
        fill(b.col);
        circle(b.x, b.y, b.r * 2);

        // Highlight
        fill(255, 255, 255, 80);
        circle(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.5);
      }
    }

    function mousePressed() {
      for (let b of balls) {
        let dx = mouseX - b.x, dy = mouseY - b.y;
        let d = sqrt(dx*dx + dy*dy);
        if (d > 0) { b.vx -= dx/d * 8; b.vy -= dy/d * 8; }
      }
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
