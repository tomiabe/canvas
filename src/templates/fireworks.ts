import { Template } from '../types';

export const fireworksTemplate: Template = {
  id: 'fireworks',
  name: 'Fireworks',
  description: 'Exploding particle fireworks with gravity and trail effects.',
  category: 'particles',
  params: [
    { id: 'launchRate', name: 'Launch Rate', type: 'number', default: 30, min: 5, max: 120, step: 5, category: 'animation', description: 'Frames between launches' },
    { id: 'particlesPerBurst', name: 'Burst Particles', type: 'number', default: 80, min: 20, max: 300, step: 10, category: 'particles', description: 'Particles per explosion' },
    { id: 'gravity', name: 'Gravity', type: 'number', default: 0.08, min: 0, max: 0.2, step: 0.01, category: 'physics', description: 'Downward pull' },
    { id: 'speed', name: 'Explosion Force', type: 'number', default: 5, min: 1, max: 12, step: 0.5, category: 'particles', description: 'Initial velocity of burst particles' },
    { id: 'trail', name: 'Trail Fade', type: 'number', default: 40, min: 5, max: 150, step: 5, category: 'animation', description: 'Trail length (higher = longer)' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff0054', '#ffbd00', '#00e5ff', '#39ff14', '#c77dff'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a1a', category: 'color' }
  ],
  presets: [
    {
      name: 'Celebration',
      params: { launchRate: 20, particlesPerBurst: 150, gravity: 0.06, speed: 8, trail: 30, palette: ['#ff0054', '#ffbd00', '#00e5ff', '#ff6b9d', '#ffffff'], bgColor: '#0a0a1a' }
    },
    {
      name: 'Sparklers',
      params: { launchRate: 60, particlesPerBurst: 40, gravity: 0.03, speed: 3, trail: 80, palette: ['#ffd700', '#ffaa00', '#ff8800', '#ffee88'], bgColor: '#000000' }
    }
  ],
  generateCode: (params, seed) => `
    let fireworks = [];
    let palette = ${JSON.stringify(params.palette)};
    let frameCount = 0;

    class Particle {
      constructor(x, y, vx, vy, color, size) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.color = color;
        this.size = size || random(2, 6);
        this.alpha = 255;
        this.trail = [];
      }

      update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > ${params.trail}) this.trail.shift();
        this.vy += ${params.gravity};
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 2;
        this.vx *= 0.98;
        this.vy *= 0.98;
      }

      show() {
        noStroke();
        for (let t of this.trail) {
          let a = map(this.trail.indexOf(t), 0, this.trail.length, 0, this.alpha);
          fill(red(this.color), green(this.color), blue(this.color), a * 0.3);
          circle(t.x, t.y, this.size * 0.5);
        }
        fill(red(this.color), green(this.color), blue(this.color), this.alpha);
        circle(this.x, this.y, this.size);
      }

      done() { return this.alpha <= 0; }
    }

    class Rocket {
      constructor() {
        this.x = random(width);
        this.y = height;
        this.vx = random(-1, 1);
        this.vy = random(-8, -12);
        this.color = random(palette);
        this.exploded = false;
        this.trail = [];
      }

      update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 10) this.trail.shift();
        this.vy += ${params.gravity} * 0.5;
        this.x += this.vx;
        this.y += this.vy;
        if (this.vy >= 0) this.exploded = true;
      }

      show() {
        stroke(255);
        strokeWeight(2);
        for (let t of this.trail) {
          stroke(255, map(this.trail.indexOf(t), 0, this.trail.length, 0, 100));
          point(t.x, t.y);
        }
        noStroke();
        fill(255);
        circle(this.x, this.y, 4);
      }

      explode() {
        let count = ${params.particlesPerBurst};
        for (let i = 0; i < count; i++) {
          let angle = random(TWO_PI);
          let speed = random(1, ${params.speed});
          let vx = cos(angle) * speed;
          let vy = sin(angle) * speed;
          fireworks.push(new Particle(this.x, this.y, vx, vy, this.color));
        }
      }
    }

    function setup() {
      createCanvas(windowWidth, windowHeight);
    }

    function draw() {
      let bg = color('${params.bgColor}');
      background(bg.levels[0], bg.levels[1], bg.levels[2], 255);

      if (frameCount % ${params.launchRate} === 0) {
        fireworks.push(new Rocket());
      }
      frameCount++;

      for (let i = fireworks.length - 1; i >= 0; i--) {
        let f = fireworks[i];
        if (f instanceof Rocket && !f.exploded) {
          f.update();
          f.show();
        } else if (f instanceof Rocket && f.exploded) {
          f.explode();
          fireworks.splice(i, 1);
        } else if (f instanceof Particle) {
          f.update();
          f.show();
          if (f.done()) fireworks.splice(i, 1);
        }
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
