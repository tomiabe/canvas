import { Template } from '../types';

export const stringArtTemplate: Template = {
  id: 'string-art',
  name: 'String Art',
  description: 'Straight lines connecting points on a circle create beautiful curves.',
  params: [
    { id: 'points', name: 'Points', type: 'number', default: 200, min: 20, max: 500, step: 10 },
    { id: 'multiplier', name: 'Multiplier', type: 'number', default: 2, min: 1.5, max: 10, step: 0.1 },
    { id: 'palette', name: 'Line Colors', type: 'color-array', default: ['#ff006e', '#8338ec', '#3a86ff'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000' },
    { id: 'opacity', name: 'Line Opacity', type: 'number', default: 60, min: 5, max: 255, step: 5 },
    { id: 'thickness', name: 'Line Thickness', type: 'number', default: 1, min: 0.3, max: 3, step: 0.1 },
    { id: 'animated', name: 'Animate Multiplier', type: 'boolean', default: true },
  ],
  presets: [
    { name: 'Cardioid', params: { points: 300, multiplier: 2, palette: ['#ff0000','#ff4400'], bgColor: '#000000', opacity: 40, thickness: 0.8, animated: true } },
    { name: 'Times Table', params: { points: 200, multiplier: 3, palette: ['#00ffff','#0080ff'], bgColor: '#000011', opacity: 50, thickness: 1, animated: true } },
    { name: 'Rainbow Web', params: { points: 360, multiplier: 4.5, palette: ['#ff0000','#ff7700','#ffff00','#00ff00','#0000ff','#ff00ff'], bgColor: '#000000', opacity: 30, thickness: 0.7, animated: false } },
  ],
  generateCode: (params, seed) => `
    let m = ${params.multiplier};
    let palette = ${JSON.stringify(params.palette)};
    let dm = 0.002;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      background('${params.bgColor}');
    }

    function draw() {
      background('${params.bgColor}');
      translate(width/2, height/2);
      let r = min(width, height) * 0.45;
      let n = ${params.points};

      for (let i = 0; i < n; i++) {
        let a1 = map(i, 0, n, 0, TWO_PI);
        let j = (i * m) % n;
        let a2 = map(j, 0, n, 0, TWO_PI);

        let x1 = cos(a1) * r, y1 = sin(a1) * r;
        let x2 = cos(a2) * r, y2 = sin(a2) * r;

        let col = color(palette[floor(i / n * palette.length) % palette.length]);
        stroke(red(col), green(col), blue(col), ${params.opacity});
        strokeWeight(${params.thickness});
        line(x1, y1, x2, y2);
      }

      if (${params.animated}) {
        m += dm;
        if (m > 10 || m < 1.5) dm *= -1;
      }
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
