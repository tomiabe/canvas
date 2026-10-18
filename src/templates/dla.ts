import { Template } from '../types';

export const dlaTemplate: Template = {
  id: 'dla',
  name: 'DLA Crystal Growth',
  description: 'Diffusion-limited aggregation - organic crystal/dendrite formation.',
  category: 'simulation',
  params: [
    { id: 'particleCount', name: 'Particle Count', type: 'number', default: 2000, min: 200, max: 10000, step: 200, category: 'simulation', description: 'Number of particles to deposit' },
    { id: 'speed', name: 'Walk Speed', type: 'number', default: 2, min: 0.5, max: 10, step: 0.5, category: 'animation', description: 'How fast particles move' },
    { id: 'stickiness', name: 'Stickiness', type: 'number', default: 50, min: 5, max: 100, step: 5, category: 'simulation', description: 'Probability of sticking (%)' },
    { id: 'branchSize', name: 'Branch Radius', type: 'number', default: 3, min: 1, max: 8, step: 1, category: 'geometry', suffix: 'px', description: 'Capture radius for branching' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#00e5ff', '#00b4d8', '#0077b6', '#c77dff'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#050510', category: 'color' }
  ],
  presets: [
    {
      name: 'Coral Reef',
      params: { particleCount: 5000, speed: 1, stickiness: 30, branchSize: 4, palette: ['#ff6b9d', '#ff0054', '#c77dff', '#00e5ff'], bgColor: '#0a0a1a' }
    },
    {
      name: 'Frost',
      params: { particleCount: 3000, speed: 3, stickiness: 70, branchSize: 2, palette: ['#ffffff', '#e0e0e0', '#a0d8ef', '#c0c0c0'], bgColor: '#000010' }
    }
  ],
  generateCode: (params, seed) => `
    let grid = {};
    let particles = [];
    let palette = ${JSON.stringify(params.palette)};
    let stick = ${params.stickiness} / 100;
    let branchR = ${params.branchSize};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      background('${params.bgColor}');
      noStroke();

      // Seed center
      let cx = floor(width / 2);
      let cy = floor(height / 2);
      grid[cx + ',' + cy] = random(palette);
      fill(grid[cx + ',' + cy]);
      circle(cx, cy, branchR * 2);

      // Spawn particles
      for (let i = 0; i < ${params.particleCount}; i++) {
        spawnParticle();
      }
    }

    function spawnParticle() {
      let angle = random(TWO_PI);
      let r = max(width, height) * 0.5;
      let x = width / 2 + cos(angle) * r;
      let y = height / 2 + sin(angle) * r;
      particles.push({ x, y, color: random(palette) });
    }

    function draw() {
      let toRemove = [];
      let speed = ${params.speed};

      for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += random(-speed, speed);
        p.y += random(-speed, speed);

        // Check stick
        let stuck = false;
        let key = floor(p.x) + ',' + floor(p.y);
        for (let dx = -branchR; dx <= branchR && !stuck; dx++) {
          for (let dy = -branchR; dy <= branchR && !stuck; dy++) {
            if (grid[(floor(p.x) + dx) + ',' + (floor(p.y) + dy)]) {
              if (random() < stick) {
                stuck = true;
              }
            }
          }
        }

        if (stuck) {
          let gx = floor(p.x);
          let gy = floor(p.y);
          let key = gx + ',' + gy;
          if (!grid[key]) {
            grid[key] = p.color;
            fill(p.color);
            circle(gx, gy, branchR * 2);
          }
          particles.splice(i, 1);
        }

        // Boundary check
        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          particles.splice(i, 1);
        }
      }

      // Respawn particles to maintain count
      while (particles.length < ${params.particleCount} * 0.3) {
        spawnParticle();
      }

      if (particles.length === 0) noLoop();
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
