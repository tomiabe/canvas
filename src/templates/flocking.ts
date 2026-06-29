import { Template } from '../types';

export const flockingTemplate: Template = {
  id: 'flocking',
  name: 'Flocking Boids',
  description: 'Emergent flocking behavior using Craig Reynolds boids algorithm.',
  category: 'simulation',
  params: [
    { id: 'count', name: 'Boid Count', type: 'number', default: 100, min: 5, max: 500, step: 5, category: 'simulation', description: 'Number of boids in the flock' },
    { id: 'maxSpeed', name: 'Max Speed', type: 'number', default: 3, min: 0.5, max: 8, step: 0.5, category: 'simulation', description: 'Maximum movement speed' },
    { id: 'alignment', name: 'Alignment', type: 'number', default: 1, min: 0, max: 3, step: 0.1, category: 'simulation', description: 'How much boids align with neighbors' },
    { id: 'cohesion', name: 'Cohesion', type: 'number', default: 1, min: 0, max: 3, step: 0.1, category: 'simulation', description: 'How much boids stay near the group' },
    { id: 'separation', name: 'Separation', type: 'number', default: 1.5, min: 0, max: 3, step: 0.1, category: 'simulation', description: 'How much boids avoid each other' },
    { id: 'viewRange', name: 'View Range', type: 'number', default: 50, min: 20, max: 200, step: 10, category: 'simulation', description: 'How far each boid can see' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#00d2ff', '#3a7bd5', '#00c9ff', '#92fe9d'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a1a', category: 'color' }
  ],
  presets: [
    {
      name: 'School of Fish',
      params: { count: 200, maxSpeed: 2, alignment: 1.5, cohesion: 0.8, separation: 1.2, viewRange: 60, palette: ['#00b4d8', '#0077b6', '#90e0ef', '#caf0f8'], bgColor: '#03045e' }
    },
    {
      name: 'Starlings',
      params: { count: 300, maxSpeed: 5, alignment: 2, cohesion: 0.5, separation: 2, viewRange: 40, palette: ['#333333', '#555555', '#888888', '#bbbbbb'], bgColor: '#000000' }
    }
  ],
  generateCode: (params, seed) => `
    let boids = [];
    let palette = ${JSON.stringify(params.palette)};

    class Boid {
      constructor() {
        this.pos = createVector(random(width), random(height));
        this.vel = p5.Vector.random2D().mult(random(1, ${params.maxSpeed}));
        this.acc = createVector(0, 0);
        this.color = random(palette);
      }

      flock(boids) {
        let align = createVector(0, 0);
        let cohere = createVector(0, 0);
        let separate = createVector(0, 0);
        let alignCount = 0, cohereCount = 0, separateCount = 0;
        let view = ${params.viewRange};

        for (let other of boids) {
          let d = p5.Vector.dist(this.pos, other.pos);
          if (other !== this && d < view) {
            if (d < view * 0.3) {
              let diff = p5.Vector.sub(this.pos, other.pos);
              diff.div(d);
              separate.add(diff);
              separateCount++;
            }
            align.add(other.vel);
            alignCount++;
            cohere.add(other.pos);
            cohereCount++;
          }
        }

        if (alignCount > 0) {
          align.div(alignCount);
          align.setMag(${params.maxSpeed});
          align.sub(this.vel);
          align.limit(0.3);
        }
        if (cohereCount > 0) {
          cohere.div(cohereCount);
          let desired = p5.Vector.sub(cohere, this.pos);
          desired.setMag(${params.maxSpeed});
          desired.sub(this.vel);
          desired.limit(0.3);
          cohere = desired;
        }
        if (separateCount > 0) {
          separate.div(separateCount);
          separate.setMag(${params.maxSpeed});
          separate.sub(this.vel);
          separate.limit(0.5);
        }

        align.mult(${params.alignment});
        cohere.mult(${params.cohesion});
        separate.mult(${params.separation});

        this.acc.add(align);
        this.acc.add(cohere);
        this.acc.add(separate);
      }

      update() {
        this.vel.add(this.acc);
        this.vel.limit(${params.maxSpeed});
        this.pos.add(this.vel);
        this.acc.mult(0);

        if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.x > width) this.pos.x = 0;
        if (this.pos.y < 0) this.pos.y = height;
        if (this.pos.y > height) this.pos.y = 0;
      }

      show() {
        let angle = this.vel.heading();
        push();
        translate(this.pos.x, this.pos.y);
        rotate(angle);
        stroke(this.color);
        strokeWeight(1.5);
        fill(this.color);
        beginShape();
        vertex(8, 0);
        vertex(-4, 3);
        vertex(-4, -3);
        endShape(CLOSE);
        pop();
      }
    }

    function setup() {
      createCanvas(windowWidth, windowHeight);
      for (let i = 0; i < ${params.count}; i++) boids.push(new Boid());
    }

    function draw() {
      background('${params.bgColor}');
      for (let b of boids) {
        b.flock(boids);
        b.update();
        b.show();
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
