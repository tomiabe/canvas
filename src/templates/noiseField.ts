import { Template } from '../types';

export const noiseFieldTemplate: Template = {
  id: 'noise-field',
  name: 'Noise Flow Field',
  description: 'Smooth flowing lines driven by Perlin noise.',
  category: 'noise',
  params: [
    { id: 'count', name: 'Line Count', type: 'number', default: 1000, min: 100, max: 5000, step: 100, category: 'particles', description: 'Number of flowing lines' },
    { id: 'noiseScale', name: 'Noise Scale', type: 'number', default: 0.01, min: 0.001, max: 0.05, step: 0.001, category: 'noise', description: 'Zoom level of the noise field (smaller = bigger features)' },
    { id: 'speed', name: 'Speed', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1, category: 'animation', description: 'How fast particles traverse the flow' },
    { id: 'opacity', name: 'Line Opacity', type: 'number', default: 20, min: 1, max: 255, step: 1, category: 'color', description: 'Transparency of each line' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#2b2d42', '#8d99ae', '#edf2f4', '#ef233c', '#d90429'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#ffffff', category: 'color' }
  ],
  presets: [
    {
      name: 'Ocean Currents',
      params: { count: 2000, noiseScale: 0.005, speed: 0.5, opacity: 10, palette: ['#03045e', '#023e8a', '#0077b6', '#0096c7', '#00b4d8'], bgColor: '#000000' }
    },
    {
      name: 'Topography',
      params: { count: 500, noiseScale: 0.02, speed: 0.1, opacity: 100, palette: ['#283618', '#606c38', '#fefae0', '#dda15e', '#bc6c25'], bgColor: '#fefae0' }
    }
  ],
  generateCode: (params, seed) => `
    let particles = [];
    let palette = ${JSON.stringify(params.palette)};
    
    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      noiseSeed(${seed});
      background('${params.bgColor}');
      
      for(let i = 0; i < ${params.count}; i++) {
        particles.push({
          x: random(width),
          y: random(height),
          color: random(palette)
        });
      }
    }
    
    function draw() {
      for(let p of particles) {
        let angle = noise(p.x * ${params.noiseScale}, p.y * ${params.noiseScale}) * TWO_PI * 2;
        let vx = cos(angle) * ${params.speed};
        let vy = sin(angle) * ${params.speed};
        
        let c = color(p.color);
        c.setAlpha(${params.opacity});
        stroke(c);
        strokeWeight(1.5);
        line(p.x, p.y, p.x + vx, p.y + vy);
        
        p.x += vx;
        p.y += vy;
        
        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          p.x = random(width);
          p.y = random(height);
        }
      }
    }
    
    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      background('${params.bgColor}');
      for(let p of particles) {
        p.x = random(width);
        p.y = random(height);
      }
    }
  `
};
