import { Template } from '../types';

export const starfieldTemplate: Template = {
  id: 'starfield',
  name: 'Starfield Warp',
  description: 'Classic warp-speed star travel through the cosmos.',
  params: [
    { id: 'count', name: 'Star Count', type: 'number', default: 400, min: 50, max: 1500, step: 50 },
    { id: 'warpSpeed', name: 'Warp Speed', type: 'number', default: 8, min: 1, max: 40, step: 1 },
    { id: 'starColor', name: 'Star Color', type: 'color', default: '#ffffff' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000' },
    { id: 'trails', name: 'Motion Trails', type: 'boolean', default: true },
    { id: 'colorful', name: 'Colorful Stars', type: 'boolean', default: false },
  ],
  presets: [
    { name: 'Hyperspace', params: { count: 600, warpSpeed: 20, starColor: '#ffffff', bgColor: '#000000', trails: true, colorful: false } },
    { name: 'Nebula', params: { count: 300, warpSpeed: 4, starColor: '#aaddff', bgColor: '#00001a', trails: true, colorful: true } },
    { name: 'Slow Drift', params: { count: 800, warpSpeed: 2, starColor: '#ffffff', bgColor: '#000510', trails: false, colorful: false } },
  ],
  generateCode: (params, seed) => `
    let stars = [];
    let colors = ['#ffffff','#aaddff','#ffddaa','#ffaaaa','#aaffdd'];

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      for (let i = 0; i < ${params.count}; i++) {
        stars.push(newStar());
      }
    }

    function newStar() {
      return {
        x: random(-width/2, width/2),
        y: random(-height/2, height/2),
        z: random(width),
        pz: 0,
        col: ${params.colorful} ? colors[floor(random(colors.length))] : '${params.starColor}'
      };
    }

    function draw() {
      if (${params.trails}) {
        let bg = color('${params.bgColor}');
        background(red(bg), green(bg), blue(bg), 80);
      } else {
        background('${params.bgColor}');
      }

      translate(width / 2, height / 2);

      for (let s of stars) {
        s.pz = s.z;
        s.z -= ${params.warpSpeed};

        if (s.z <= 0) {
          s.x = random(-width/2, width/2);
          s.y = random(-height/2, height/2);
          s.z = width;
          s.pz = s.z;
        }

        let sx = map(s.x / s.z, 0, 1, 0, width);
        let sy = map(s.y / s.z, 0, 1, 0, height);
        let r = map(s.z, 0, width, 4, 0);
        let brightness = map(s.z, 0, width, 255, 0);

        let col = color(s.col);
        stroke(red(col), green(col), blue(col), brightness);
        strokeWeight(r);

        if (${params.trails}) {
          let px = map(s.x / s.pz, 0, 1, 0, width);
          let py = map(s.y / s.pz, 0, 1, 0, height);
          line(px, py, sx, sy);
        } else {
          point(sx, sy);
        }
      }
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
