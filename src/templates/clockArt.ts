import { Template } from '../types';

export const clockArtTemplate: Template = {
  id: 'clock-art',
  name: 'Generative Clock',
  description: 'A mesmerizing clock where every second leaves a visual trace.',
  params: [
    { id: 'rings', name: 'Ring Count', type: 'number', default: 4, min: 1, max: 8, step: 1 },
    { id: 'trailLen', name: 'Trail Length', type: 'number', default: 120, min: 10, max: 360, step: 10 },
    { id: 'palette', name: 'Colors', type: 'color-array', default: ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000' },
    { id: 'showHands', name: 'Show Hands', type: 'boolean', default: true },
    { id: 'thickness', name: 'Trail Width', type: 'number', default: 2, min: 0.5, max: 8, step: 0.5 },
    { id: 'style', name: 'Style', type: 'enum', default: 'radial', options: ['radial', 'spiral', 'orbit'] },
  ],
  presets: [
    { name: 'Neon', params: { rings: 4, trailLen: 180, palette: ['#ff00cc','#00ffcc','#ffcc00','#0099ff'], bgColor: '#000000', showHands: true, thickness: 2, style: 'radial' } },
    { name: 'Minimal', params: { rings: 3, trailLen: 60, palette: ['#ffffff','#aaaaaa','#555555'], bgColor: '#000000', showHands: false, thickness: 1.5, style: 'orbit' } },
    { name: 'Spiral Art', params: { rings: 6, trailLen: 300, palette: ['#ff4500','#ff8c00','#ffd700','#adff2f','#7fffd4','#1e90ff'], bgColor: '#050505', showHands: false, thickness: 1.5, style: 'spiral' } },
  ],
  generateCode: (params, seed) => `
    let trails = [];
    let palette = ${JSON.stringify(params.palette)};
    let rings = ${params.rings};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      colorMode(RGB, 255, 255, 255, 255);
      for (let i = 0; i < rings; i++) {
        trails.push([]);
      }
    }

    function draw() {
      background('${params.bgColor}');
      translate(width/2, height/2);

      let s = second() / 60;
      let m = (minute() + s) / 60;
      let h = (hour() % 12 + m) / 12;
      let times = [s, m, h];
      let extraRings = rings - 3;

      // Extra rings use noise-driven time
      for (let i = 0; i < extraRings; i++) {
        times.push((millis() * 0.0001 * (i + 2)) % 1);
      }

      let r = min(width, height) * 0.4;
      let style = '${params.style}';

      for (let ri = 0; ri < rings; ri++) {
        let t = times[ri % times.length];
        let ringR = r * (ri + 1) / rings;
        let angle = t * TWO_PI - HALF_PI;
        let x = cos(angle) * ringR;
        let y = sin(angle) * ringR;

        trails[ri].push({ x, y });
        if (trails[ri].length > ${params.trailLen}) trails[ri].shift();

        let col = color(palette[ri % palette.length]);
        noFill();

        for (let i = 1; i < trails[ri].length; i++) {
          let a = map(i, 0, trails[ri].length, 0, 180);
          stroke(red(col), green(col), blue(col), a);
          strokeWeight(${params.thickness});
          if (style === 'radial') {
            line(trails[ri][i-1].x, trails[ri][i-1].y, trails[ri][i].x, trails[ri][i].y);
          } else if (style === 'spiral') {
            let sr = ringR * (i / trails[ri].length);
            let sx = trails[ri][i].x * sr / ringR;
            let sy = trails[ri][i].y * sr / ringR;
            point(sx, sy);
          } else {
            line(trails[ri][i-1].x, trails[ri][i-1].y, trails[ri][i].x, trails[ri][i].y);
          }
        }

        if (${params.showHands}) {
          stroke(col);
          strokeWeight(${params.thickness} * 1.5);
          line(0, 0, x, y);
          fill(col);
          noStroke();
          circle(x, y, 6);
        }
      }
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
