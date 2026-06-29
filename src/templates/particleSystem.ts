import { Template } from '../types';

export const particleSystemTemplate: Template = {
  id: 'particle-system',
  name: 'Particle System',
  description: 'A swarm of particles moving organically with mouse attraction.',
  category: 'particles',
  params: [
    { id: 'count', name: 'Particle Count', type: 'number', default: 300, min: 10, max: 1000, step: 10, category: 'particles', description: 'Number of particles on screen' },
    { id: 'speed', name: 'Speed', type: 'number', default: 1.2, min: 0.1, max: 5, step: 0.1, category: 'physics', description: 'Base movement speed' },
    { id: 'trailLength', name: 'Trail Length', type: 'number', default: 40, min: 0, max: 255, step: 1, category: 'animation', description: 'How long particle trails persist' },
    { id: 'gravity', name: 'Gravity', type: 'number', default: 0, min: -0.5, max: 0.5, step: 0.01, category: 'physics', description: 'Vertical pull on particles (negative = upward)' },
    { id: 'mouseAttract', name: 'Mouse Attract', type: 'boolean', default: true, category: 'interaction', description: 'Particles follow the mouse cursor' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#1a1a2e', '#e94560', '#f5a623'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0f0f1a', category: 'color' }
  ],
  presets: [
    {
      name: 'Fireflies',
      params: { count: 150, speed: 0.5, trailLength: 20, gravity: -0.01, mouseAttract: true, palette: ['#f9dc5c', '#fae588', '#fcefb4'], bgColor: '#0b132b' }
    },
    {
      name: 'Matrix',
      params: { count: 500, speed: 3, trailLength: 100, gravity: 0.1, mouseAttract: false, palette: ['#00ff00', '#33ff33', '#00cc00'], bgColor: '#000000' }
    },
    {
      name: 'Cosmic Dust',
      params: { count: 800, speed: 0.2, trailLength: 10, gravity: 0, mouseAttract: true, palette: ['#ff9e00', '#ff9100', '#ff6d00', '#ff5400', '#ff0054'], bgColor: '#10002b' }
    }
  ],
  generateCode: (params, seed) => `
    let particles = [];
    let palette = ${JSON.stringify(params.palette)};
    
    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      noiseSeed(${seed});
      
      for(let i = 0; i < ${params.count}; i++) {
        particles.push({
          x: random(width),
          y: random(height),
          vx: random(-1, 1) * ${params.speed},
          vy: random(-1, 1) * ${params.speed},
          color: random(palette),
          size: random(2, 6)
        });
      }
      background('${params.bgColor}');
    }
    
    function draw() {
      let bg = color('${params.bgColor}');
      background(bg.levels[0], bg.levels[1], bg.levels[2], 255 - ${params.trailLength});
      
      for(let p of particles) {
        if (${params.mouseAttract} && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
          let dx = mouseX - p.x;
          let dy = mouseY - p.y;
          let dist = sqrt(dx*dx + dy*dy);
          if (dist > 0) {
            p.vx += (dx / dist) * 0.05;
            p.vy += (dy / dist) * 0.05;
          }
        }
        
        p.vy += ${params.gravity};
        
        // Limit speed
        let speed = sqrt(p.vx*p.vx + p.vy*p.vy);
        if (speed > ${params.speed} * 2) {
          p.vx = (p.vx / speed) * ${params.speed} * 2;
          p.vy = (p.vy / speed) * ${params.speed} * 2;
        }
        
        p.x += p.vx;
        p.y += p.vy;
        
        // Wrap around
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        
        noStroke();
        fill(p.color);
        circle(p.x, p.y, p.size);
      }
    }
    
    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      background('${params.bgColor}');
    }
  `
};
