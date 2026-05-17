import { Template } from '../types';

export const rainDropsTemplate: Template = {
  id: 'rain-drops',
  name: 'Rain & Ripples',
  description: 'Falling rain with expanding ripple rings on a reflective surface.',
  params: [
    { id: 'intensity', name: 'Rain Intensity', type: 'number', default: 5, min: 1, max: 20, step: 1 },
    { id: 'windAngle', name: 'Wind Angle', type: 'number', default: 0, min: -45, max: 45, step: 5 },
    { id: 'dropColor', name: 'Rain Color', type: 'color', default: '#aaccff' },
    { id: 'rippleColor', name: 'Ripple Color', type: 'color', default: '#6699cc' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#001122' },
    { id: 'poolColor', name: 'Pool Color', type: 'color', default: '#002244' },
    { id: 'speed', name: 'Drop Speed', type: 'number', default: 12, min: 4, max: 30, step: 1 },
  ],
  presets: [
    { name: 'Gentle Rain', params: { intensity: 3, windAngle: -10, dropColor: '#99ccee', rippleColor: '#5588aa', bgColor: '#001825', poolColor: '#002233', speed: 10 } },
    { name: 'Storm', params: { intensity: 15, windAngle: 20, dropColor: '#aabbcc', rippleColor: '#8899aa', bgColor: '#000a12', poolColor: '#001122', speed: 22 } },
    { name: 'Neon Rain', params: { intensity: 8, windAngle: 0, dropColor: '#00ffcc', rippleColor: '#00aa88', bgColor: '#000a08', poolColor: '#001a10', speed: 15 } },
  ],
  generateCode: (params, seed) => `
    let drops = [], ripples = [];
    let poolY;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      poolY = height * 0.75;
    }

    function newDrop() {
      let wx = tan(radians(${params.windAngle}));
      return {
        x: random(-50, width + 50),
        y: random(-100, 0),
        len: random(15, 30),
        speed: random(${params.speed} * 0.8, ${params.speed} * 1.2),
        wx,
      };
    }

    function draw() {
      background('${params.bgColor}');

      // Pool
      noStroke();
      fill('${params.poolColor}');
      rect(0, poolY, width, height - poolY);

      // Add drops
      for (let i = 0; i < ${params.intensity}; i++) {
        drops.push(newDrop());
      }

      // Draw drops
      stroke('${params.dropColor}');
      strokeWeight(1);
      for (let i = drops.length - 1; i >= 0; i--) {
        let d = drops[i];
        line(d.x, d.y, d.x - d.wx * d.len, d.y - d.len);
        d.x += d.wx * d.speed * 0.1;
        d.y += d.speed;
        if (d.y >= poolY) {
          ripples.push({ x: d.x, y: poolY, r: 0, maxR: random(20, 50), alpha: 200 });
          drops.splice(i, 1);
        } else if (d.y > height + 50) drops.splice(i, 1);
      }

      // Draw ripples
      noFill();
      for (let i = ripples.length - 1; i >= 0; i--) {
        let r = ripples[i];
        stroke(color('${params.rippleColor}'));
        let rc = color('${params.rippleColor}');
        stroke(red(rc), green(rc), blue(rc), r.alpha);
        strokeWeight(1);
        ellipse(r.x, r.y, r.r * 2, r.r * 0.5);
        r.r += 1.5;
        r.alpha -= 5;
        if (r.alpha <= 0) ripples.splice(i, 1);
      }
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); poolY = height * 0.75; }
  `,
};
