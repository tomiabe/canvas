import { Template } from '../types';

export const solarSystemTemplate: Template = {
  id: 'solar-system',
  name: 'Solar System',
  description: '2D orbital mechanics simulation with planets orbiting a star.',
  category: 'physics',
  params: [
    { id: 'planetCount', name: 'Planet Count', type: 'number', default: 5, min: 1, max: 12, step: 1, category: 'physics', description: 'Number of planets' },
    { id: 'speed', name: 'Orbit Speed', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1, category: 'animation', description: 'Overall simulation speed' },
    { id: 'orbitSize', name: 'Orbit Spread', type: 'number', default: 250, min: 100, max: 500, step: 10, category: 'geometry', suffix: 'px', description: 'Maximum orbit radius' },
    { id: 'starSize', name: 'Star Size', type: 'number', default: 30, min: 10, max: 80, step: 5, category: 'geometry', description: 'Size of the central star' },
    { id: 'showOrbits', name: 'Show Orbits', type: 'boolean', default: true, category: 'layout', description: 'Display orbit paths' },
    { id: 'starColor', name: 'Star Color', type: 'color', default: '#ffd700', category: 'color' },
    { id: 'palette', name: 'Planet Colors', type: 'color-array', default: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff', '#ff6b9d', '#00e5ff'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#050510', category: 'color' }
  ],
  presets: [
    {
      name: 'Our Solar System',
      params: { planetCount: 8, speed: 0.5, orbitSize: 350, starSize: 40, showOrbits: true, starColor: '#ffd700', palette: ['#c0c0c0', '#ffd700', '#00bfff', '#ff4500', '#f5deb3', '#ffd700', '#00e5ff', '#4169e1'], bgColor: '#000010' }
    },
    {
      name: 'Binary Star',
      params: { planetCount: 10, speed: 2, orbitSize: 200, starSize: 20, showOrbits: false, starColor: '#ff6b6b', palette: ['#ff0054', '#ff6b9d', '#c77dff', '#00b4d8', '#00e5ff', '#39ff14', '#ffbd00', '#ff0000'], bgColor: '#000000' }
    }
  ],
  generateCode: (params, seed) => `
    let planets = [];
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      for (let i = 0; i < ${params.planetCount}; i++) {
        let orbitRadius = map(i, 0, ${params.planetCount}, 50, ${params.orbitSize});
        let angle = random(TWO_PI);
        planets.push({
          orbit: orbitRadius,
          angle: angle,
          speed: random(0.005, 0.02) * ${params.speed},
          size: random(4, 16),
          color: random(palette),
          phase: random(TWO_PI)
        });
      }
    }

    function draw() {
      background('${params.bgColor}');
      translate(width / 2, height / 2);

      // Draw orbits
      if (${params.showOrbits}) {
        noFill();
        stroke(255, 20);
        strokeWeight(0.5);
        for (let p of planets) {
          circle(0, 0, p.orbit * 2);
        }
      }

      // Draw star
      noStroke();
      let starGlow = color('${params.starColor}');
      for (let i = 5; i >= 0; i--) {
        starGlow.setAlpha(30 - i * 5);
        fill(starGlow);
        circle(0, 0, ${params.starSize} + i * 15);
      }
      fill('${params.starColor}');
      circle(0, 0, ${params.starSize});

      // Update and draw planets
      for (let p of planets) {
        p.angle += p.speed;
        let x = cos(p.angle) * p.orbit;
        let y = sin(p.angle) * p.orbit;

        // Orbit trail
        let trailColor = color(p.color);
        trailColor.setAlpha(30);
        noStroke();
        fill(trailColor);
        circle(x, y, p.size * 2.5);

        fill(p.color);
        circle(x, y, p.size);
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
