import { Template } from '../types';

export const constellationsTemplate: Template = {
  id: 'constellations',
  name: 'Constellations',
  description: 'Stars connect when near each other, forming dynamic constellations.',
  params: [
    { id: 'stars', name: 'Star Count', type: 'number', default: 120, min: 20, max: 400, step: 10 },
    { id: 'connectDist', name: 'Connect Distance', type: 'number', default: 120, min: 30, max: 300, step: 10 },
    { id: 'speed', name: 'Drift Speed', type: 'number', default: 0.4, min: 0, max: 2, step: 0.1 },
    { id: 'starColor', name: 'Star Color', type: 'color', default: '#ffffff' },
    { id: 'lineColor', name: 'Line Color', type: 'color', default: '#334455' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000814' },
    { id: 'mouseConnect', name: 'Mouse Connect', type: 'boolean', default: true },
    { id: 'twinkle', name: 'Twinkle', type: 'boolean', default: true },
  ],
  presets: [
    { name: 'Night Sky', params: { stars: 150, connectDist: 100, speed: 0.3, starColor: '#ffffff', lineColor: '#223344', bgColor: '#000814', mouseConnect: true, twinkle: true } },
    { name: 'Neon Web', params: { stars: 80, connectDist: 160, speed: 0.8, starColor: '#00ffcc', lineColor: '#006644', bgColor: '#000a08', mouseConnect: true, twinkle: false } },
    { name: 'Gold Dust', params: { stars: 200, connectDist: 80, speed: 0.2, starColor: '#ffd700', lineColor: '#664400', bgColor: '#050300', mouseConnect: false, twinkle: true } },
  ],
  generateCode: (params, seed) => `
    let stars = [];

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      for (let i = 0; i < ${params.stars}; i++) {
        stars.push({
          x: random(width), y: random(height),
          vx: random(-1, 1) * ${params.speed},
          vy: random(-1, 1) * ${params.speed},
          size: random(1, 3.5),
          phase: random(TWO_PI),
        });
      }
    }

    function draw() {
      background('${params.bgColor}');

      // Draw connections
      let maxDist = ${params.connectDist};
      let lineCol = color('${params.lineColor}');

      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          let d = dist(stars[i].x, stars[i].y, stars[j].x, stars[j].y);
          if (d < maxDist) {
            let a = map(d, 0, maxDist, 150, 0);
            stroke(red(lineCol), green(lineCol), blue(lineCol), a);
            strokeWeight(map(d, 0, maxDist, 1.5, 0.2));
            line(stars[i].x, stars[i].y, stars[j].x, stars[j].y);
          }
        }

        if (${params.mouseConnect}) {
          let d = dist(stars[i].x, stars[i].y, mouseX, mouseY);
          if (d < maxDist * 1.5) {
            let a = map(d, 0, maxDist * 1.5, 200, 0);
            stroke(200, 200, 255, a);
            strokeWeight(0.8);
            line(stars[i].x, stars[i].y, mouseX, mouseY);
          }
        }
      }

      // Draw stars
      noStroke();
      for (let s of stars) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        let alpha = ${params.twinkle} ? map(sin(frameCount * 0.05 + s.phase), -1, 1, 100, 255) : 220;
        fill(255, 255, 255, alpha);
        circle(s.x, s.y, s.size * 2);
      }

      if (${params.mouseConnect}) {
        noStroke();
        fill(200, 200, 255, 200);
        circle(mouseX, mouseY, 5);
      }
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
