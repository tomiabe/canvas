import { Template } from '../types';

export const neonLinesTemplate: Template = {
  id: 'neon-lines',
  name: 'Neon Lines',
  description: 'Particles connected by glowing lines when close to each other.',
  category: 'particles',
  params: [
    { id: 'count', name: 'Particle Count', type: 'number', default: 80, min: 10, max: 300, step: 5, category: 'particles', description: 'Number of nodes' },
    { id: 'connectDist', name: 'Connection Distance', type: 'number', default: 120, min: 20, max: 300, step: 10, category: 'geometry', suffix: 'px', description: 'Max distance for drawing a line' },
    { id: 'speed', name: 'Movement Speed', type: 'number', default: 0.5, min: 0.1, max: 3, step: 0.1, category: 'animation', description: 'How fast particles drift' },
    { id: 'glowIntensity', name: 'Glow Intensity', type: 'number', default: 0.8, min: 0, max: 2, step: 0.1, category: 'color', description: 'Line glow brightness' },
    { id: 'lineWidth', name: 'Line Width', type: 'number', default: 1.5, min: 0.5, max: 5, step: 0.5, category: 'geometry', description: 'Thickness of connecting lines' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#00e5ff', '#00b4d8', '#c77dff', '#ff6b9d', '#ffbd00'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#050510', category: 'color' }
  ],
  presets: [
    {
      name: 'Neural Network',
      params: { count: 150, connectDist: 80, speed: 0.3, glowIntensity: 1, lineWidth: 1, palette: ['#00ff88', '#00e5ff', '#0077b6'], bgColor: '#050510' }
    },
    {
      name: 'Constellation',
      params: { count: 60, connectDist: 180, speed: 0.2, glowIntensity: 1.5, lineWidth: 2, palette: ['#ffd700', '#ffaa00', '#ffffff'], bgColor: '#000008' }
    }
  ],
  generateCode: (params, seed) => `
    let particles = [];
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      for (let i = 0; i < ${params.count}; i++) {
        particles.push({
          x: random(width),
          y: random(height),
          vx: random(-1, 1) * ${params.speed},
          vy: random(-1, 1) * ${params.speed},
          color: random(palette)
        });
      }
    }

    function draw() {
      background('${params.bgColor}');

      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      let connectDist = ${params.connectDist};
      let glow = ${params.glowIntensity};

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          let a = particles[i];
          let b = particles[j];
          let d = dist(a.x, a.y, b.x, b.y);

          if (d < connectDist) {
            let alpha = map(d, 0, connectDist, 255 * glow, 0);
            stroke(red(a.color), green(a.color), blue(a.color), alpha);
            strokeWeight(${params.lineWidth} * (1 - d / connectDist));
            line(a.x, a.y, b.x, b.y);
          }
        }
      }

      for (let p of particles) {
        noStroke();
        fill(p.color);
        circle(p.x, p.y, 4);
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
