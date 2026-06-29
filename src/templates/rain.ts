import { Template } from '../types';

export const rainTemplate: Template = {
  id: 'rain',
  name: 'Rain',
  description: 'Atmospheric rain effect with wind, splashes, and layered depth.',
  category: 'particles',
  params: [
    { id: 'count', name: 'Raindrop Count', type: 'number', default: 500, min: 50, max: 3000, step: 50, category: 'particles', description: 'Number of raindrops' },
    { id: 'speed', name: 'Fall Speed', type: 'number', default: 8, min: 2, max: 20, step: 1, category: 'physics', description: 'How fast drops fall' },
    { id: 'wind', name: 'Wind', type: 'number', default: 0.3, min: -1, max: 1, step: 0.1, category: 'physics', description: 'Horizontal wind force' },
    { id: 'length', name: 'Drop Length', type: 'number', default: 15, min: 3, max: 40, step: 1, category: 'particles', description: 'Length of each raindrop streak' },
    { id: 'opacity', name: 'Opacity', type: 'number', default: 80, min: 10, max: 200, step: 5, category: 'particles', description: 'Rain opacity' },
    { id: 'thunder', name: 'Thunder Flashes', type: 'boolean', default: false, category: 'animation', description: 'Random screen flashes' },
    { id: 'dropColor', name: 'Drop Color', type: 'color', default: '#a8d8ea', category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#1a1a2e', category: 'color' }
  ],
  presets: [
    {
      name: 'Storm',
      params: { count: 2000, speed: 15, wind: 0.8, length: 25, opacity: 150, thunder: true, dropColor: '#c0c0c0', bgColor: '#0a0a0a' }
    },
    {
      name: 'Drizzle',
      params: { count: 150, speed: 4, wind: 0.1, length: 8, opacity: 40, thunder: false, dropColor: '#a8d8ea', bgColor: '#2d3436' }
    }
  ],
  generateCode: (params, seed) => `
    let drops = [];

    function setup() {
      createCanvas(windowWidth, windowHeight);
      for (let i = 0; i < ${params.count}; i++) {
        drops.push({
          x: random(width),
          y: random(-height, 0),
          z: random(0.3, 1),
          speed: random(${params.speed} * 0.5, ${params.speed} * 1.5),
          len: random(${params.length} * 0.5, ${params.length} * 1.5)
        });
      }
    }

    function draw() {
      background('${params.bgColor}');

      if (${params.thunder} && random(1000) < 1) {
        background(200, 200, 255, 80);
      }

      for (let d of drops) {
        let thickness = map(d.z, 0.3, 1, 0.5, 2);
        let alpha = map(d.z, 0.3, 1, ${params.opacity} * 0.4, ${params.opacity});
        let dropColor = color('${params.dropColor}');
        dropColor.setAlpha(alpha);

        stroke(dropColor);
        strokeWeight(thickness);
        line(d.x, d.y, d.x + ${params.wind} * d.z * 3, d.y + d.len);

        d.x += ${params.wind} * d.z;
        d.y += d.speed * d.z;

        if (d.y > height + d.len) {
          d.y = random(-height * 0.5, 0);
          d.x = random(width);
          d.z = random(0.3, 1);
        }
        if (d.x > width + 10) d.x = -10;
        if (d.x < -10) d.x = width + 10;
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
