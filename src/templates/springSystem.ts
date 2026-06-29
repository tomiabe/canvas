import { Template } from '../types';

export const springSystemTemplate: Template = {
  id: 'spring-system',
  name: 'Spring System',
  description: 'Mass-spring physics simulation with connected particles and tension.',
  category: 'physics',
  params: [
    { id: 'particleCount', name: 'Particles', type: 'number', default: 12, min: 3, max: 40, step: 1, category: 'physics', description: 'Number of connected masses' },
    { id: 'stiffness', name: 'Stiffness', type: 'number', default: 0.02, min: 0.001, max: 0.1, step: 0.002, category: 'physics', description: 'Spring tension strength' },
    { id: 'damping', name: 'Damping', type: 'number', default: 0.97, min: 0.9, max: 0.999, step: 0.005, category: 'physics', description: 'Velocity damping per frame' },
    { id: 'restLength', name: 'Rest Length', type: 'number', default: 60, min: 10, max: 150, step: 5, category: 'physics', suffix: 'px', description: 'Equilibrium spring distance' },
    { id: 'gravity', name: 'Gravity', type: 'number', default: 0.5, min: 0, max: 3, step: 0.1, category: 'physics', description: 'Downward force' },
    { id: 'pinMode', name: 'Pin Mode', type: 'enum', default: 'ends', options: ['none', 'ends', 'first', 'center'], category: 'physics', description: 'Which particles are fixed in place' },
    { id: 'trail', name: 'Show Trail', type: 'boolean', default: false, category: 'animation', description: 'Draw motion trails' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#00e5ff', '#00b4d8', '#0077b6', '#c77dff', '#ff6b9d'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a1a', category: 'color' }
  ],
  presets: [
    { name: 'Slinky', params: { particleCount: 20, stiffness: 0.015, damping: 0.98, restLength: 40, gravity: 1, pinMode: 'first' } },
    { name: 'Jelly', params: { particleCount: 8, stiffness: 0.06, damping: 0.95, restLength: 80, gravity: 0.3, pinMode: 'center' } },
    { name: 'Chain Pendulum', params: { particleCount: 15, stiffness: 0.03, damping: 0.99, restLength: 50, gravity: 1.5, pinMode: 'first' } },
  ],
  generateCode: (params, seed) => `
    let particles = [];
    let palette = ${JSON.stringify(params.palette)};
    let stiffness = ${params.stiffness};
    let damping = ${params.damping};
    let restLength = ${params.restLength};
    let gravity = ${params.gravity};
    let pinMode = '${params.pinMode}';
    let showTrail = ${params.trail};
    let bgColor = '${params.bgColor}';

    class Particle {
      constructor(x, y, pinned) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.pinned = pinned;
      }

      applyForce(fx, fy) {
        if (this.pinned) return;
        this.vx += fx;
        this.vy += fy;
      }

      update() {
        if (this.pinned) return;
        this.vx *= damping;
        this.vy *= damping;
        this.vy += gravity;
        this.x += this.vx;
        this.y += this.vy;
      }

      constrainBounds() {
        if (this.x < 0) { this.x = 0; this.vx *= -0.5; }
        if (this.x > width) { this.x = width; this.vx *= -0.5; }
        if (this.y < 0) { this.y = 0; this.vy *= -0.5; }
        if (this.y > height) { this.y = height; this.vy *= -0.5; }
      }
    }

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      initParticles();
    }

    function initParticles() {
      particles = [];
      let cx = width / 2;
      let cy = height / 3;
      for (let i = 0; i < ${params.particleCount}; i++) {
        let pinned = false;
        if (pinMode === 'first' && i === 0) pinned = true;
        else if (pinMode === 'ends' && (i === 0 || i === ${params.particleCount} - 1)) pinned = true;
        else if (pinMode === 'center' && i === floor(${params.particleCount} / 2)) pinned = true;
        particles.push(new Particle(cx + i * restLength - (${params.particleCount} - 1) * restLength / 2, cy, pinned));
      }
    }

    function draw() {
      background(bgColor);

      // Spring forces
      for (let i = 0; i < particles.length - 1; i++) {
        let a = particles[i];
        let b = particles[i + 1];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = sqrt(dx * dx + dy * dy);
        if (dist < 0.01) dist = 0.01;
        let force = (dist - restLength) * stiffness;
        let fx = (dx / dist) * force;
        let fy = (dy / dist) * force;
        a.applyForce(fx, fy);
        b.applyForce(-fx, -fy);
      }

      // Update
      for (let p of particles) {
        p.update();
        p.constrainBounds();
      }

      // Draw springs
      strokeWeight(2);
      for (let i = 0; i < particles.length - 1; i++) {
        let a = particles[i];
        let b = particles[i + 1];
        let c = color(palette[i % palette.length]);
        stroke(red(c), green(c), blue(c), 180);
        line(a.x, a.y, b.x, b.y);
      }

      // Draw trail
      if (showTrail) {
        for (let i = 0; i < particles.length; i++) {
          let c = color(palette[i % palette.length]);
          fill(red(c), green(c), blue(c), 30);
          noStroke();
          circle(particles[i].x, particles[i].y, 20);
        }
      }

      // Draw particles
      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        let c = color(palette[i % palette.length]);
        fill(p.pinned ? 255 : red(c), p.pinned ? 255 : green(c), p.pinned ? 255 : blue(c));
        noStroke();
        circle(p.x, p.y, p.pinned ? 10 : 8);
      }
    }

    function mouseDragged() {
      let closest = null;
      let minD = 50;
      for (let p of particles) {
        let d = dist(mouseX, mouseY, p.x, p.y);
        if (d < minD) { minD = d; closest = p; }
      }
      if (closest) {
        closest.x = mouseX;
        closest.y = mouseY;
        closest.vx = 0;
        closest.vy = 0;
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      initParticles();
    }
  `,
};
