import { Template } from '../types';

export const bouncingBallsTemplate: Template = {
  id: 'bouncing-balls',
  name: 'Bouncing Balls',
  description: 'Physics simulation with gravity, bouncing, and collisions.',
  category: 'physics',
  params: [
    { id: 'count', name: 'Ball Count', type: 'number', default: 30, min: 3, max: 200, step: 1, category: 'physics', description: 'Number of balls in the simulation' },
    { id: 'gravity', name: 'Gravity', type: 'number', default: 0.5, min: 0, max: 2, step: 0.1, category: 'physics', description: 'Downward acceleration force' },
    { id: 'restitution', name: 'Bounciness', type: 'number', default: 0.7, min: 0.1, max: 1, step: 0.05, category: 'physics', description: 'How much energy is preserved on bounce' },
    { id: 'ballSize', name: 'Ball Size', type: 'number', default: 20, min: 5, max: 60, step: 1, category: 'geometry', description: 'Diameter of each ball' },
    { id: 'speed', name: 'Initial Speed', type: 'number', default: 3, min: 0.5, max: 10, step: 0.5, category: 'physics', description: 'Starting velocity magnitude' },
    { id: 'palette', name: 'Ball Colors', type: 'color-array', default: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d'], category: 'color', description: 'Colors assigned randomly to balls' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a0a', category: 'color' }
  ],
  presets: [
    {
      name: 'Zero G',
      params: { count: 100, gravity: 0, restitution: 0.95, ballSize: 12, speed: 5, palette: ['#00d2ff', '#3a7bd5', '#00c9ff', '#92fe9d'], bgColor: '#000000' }
    },
    {
      name: 'Heavy Planets',
      params: { count: 8, gravity: 0.8, restitution: 0.3, ballSize: 50, speed: 2, palette: ['#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#1a659e'], bgColor: '#0d1321' }
    }
  ],
  generateCode: (params, seed) => `
    let balls = [];
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      for (let i = 0; i < ${params.count}; i++) {
        balls.push({
          x: random(width),
          y: random(height),
          vx: random(-${params.speed}, ${params.speed}),
          vy: random(-${params.speed}, ${params.speed}),
          r: random(${params.ballSize} * 0.5, ${params.ballSize}),
          color: random(palette),
          mass: random(0.5, 2)
        });
      }
    }

    function draw() {
      background('${params.bgColor}');

      for (let b of balls) {
        b.vy += ${params.gravity} * b.mass;
        b.x += b.vx;
        b.y += b.vy;

        if (b.x < b.r || b.x > width - b.r) {
          b.vx *= -${params.restitution};
          b.x = constrain(b.x, b.r, width - b.r);
        }
        if (b.y < b.r || b.y > height - b.r) {
          b.vy *= -${params.restitution};
          b.y = constrain(b.y, b.r, height - b.r);
        }

        for (let other of balls) {
          if (b === other) continue;
          let dx = other.x - b.x;
          let dy = other.y - b.y;
          let dist = sqrt(dx * dx + dy * dy);
          let minDist = b.r + other.r;
          if (dist < minDist && dist > 0) {
            let overlap = minDist - dist;
            let nx = dx / dist;
            let ny = dy / dist;
            b.x -= nx * overlap * 0.5;
            b.y -= ny * overlap * 0.5;
            other.x += nx * overlap * 0.5;
            other.y += ny * overlap * 0.5;
            let relVx = b.vx - other.vx;
            let relVy = b.vy - other.vy;
            let relVn = relVx * nx + relVy * ny;
            if (relVn < 0) {
              let impulse = -(1 + ${params.restitution}) * relVn / (1/b.mass + 1/other.mass);
              b.vx += impulse * nx / b.mass;
              b.vy += impulse * ny / b.mass;
              other.vx -= impulse * nx / other.mass;
              other.vy -= impulse * ny / other.mass;
            }
          }
        }

        noStroke();
        fill(b.color);
        circle(b.x, b.y, b.r * 2);
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
