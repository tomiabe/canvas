import { Template } from '../types';

export const terrain3DTemplate: Template = {
  id: 'terrain-3d',
  name: '3D Terrain',
  description: 'Fly over a procedurally generated 3D landscape.',
  params: [
    { id: 'cols', name: 'Grid Columns', type: 'number', default: 40, min: 10, max: 80, step: 5 },
    { id: 'rows', name: 'Grid Rows', type: 'number', default: 40, min: 10, max: 80, step: 5 },
    { id: 'scale', name: 'Scale', type: 'number', default: 20, min: 8, max: 50, step: 2 },
    { id: 'height', name: 'Mountain Height', type: 'number', default: 120, min: 20, max: 300, step: 10 },
    { id: 'speed', name: 'Fly Speed', type: 'number', default: 0.05, min: 0, max: 0.3, step: 0.01 },
    { id: 'palette', name: 'Colors', type: 'color-array', default: ['#000080', '#0000ff', '#008000', '#00aa00', '#888888', '#ffffff'] },
    { id: 'bgColor', name: 'Sky Color', type: 'color', default: '#000011' },
    { id: 'wireframe', name: 'Wireframe', type: 'boolean', default: true },
  ],
  presets: [
    { name: 'Night Flight', params: { cols: 40, rows: 40, scale: 20, height: 120, speed: 0.06, palette: ['#000050','#0000cc','#003300','#006600','#445544','#aaaaaa'], bgColor: '#000011', wireframe: true } },
    { name: 'Mars', params: { cols: 35, rows: 35, scale: 25, height: 150, speed: 0.04, palette: ['#440000','#883300','#aa4400','#cc6622','#ddaa88','#ffffff'], bgColor: '#1a0500', wireframe: false } },
    { name: 'Arctic', params: { cols: 30, rows: 30, scale: 22, height: 90, speed: 0.08, palette: ['#003366','#0055aa','#88aacc','#ccddee','#eeeeff','#ffffff'], bgColor: '#000022', wireframe: true } },
  ],
  generateCode: (params, seed) => `
    let terrain = [];
    let cols = ${params.cols} + 1, rows = ${params.rows} + 1;
    let scl = ${params.scale};
    let t = 0;
    let palette = ${JSON.stringify(params.palette)};

    function getTerrainColor(h) {
      let norm = map(h, -${params.height}, ${params.height}, 0, 1);
      let idx = floor(norm * (palette.length - 1));
      let frac = norm * (palette.length - 1) - idx;
      let c1 = color(palette[min(idx, palette.length-1)]);
      let c2 = color(palette[min(idx+1, palette.length-1)]);
      return lerpColor(c1, c2, frac);
    }

    function setup() {
      createCanvas(windowWidth, windowHeight, WEBGL);
      noiseSeed(${seed});
    }

    function draw() {
      background('${params.bgColor}');

      // Generate terrain
      let yoff = t;
      for (let y = 0; y < rows; y++) {
        terrain[y] = [];
        let xoff = 0;
        for (let x = 0; x < cols; x++) {
          terrain[y][x] = map(noise(xoff, yoff), 0, 1, -${params.height}, ${params.height});
          xoff += 0.12;
        }
        yoff += 0.12;
      }

      rotateX(PI/3.5);
      translate(-cols * scl / 2, 0);

      for (let y = 0; y < rows - 1; y++) {
        beginShape(TRIANGLE_STRIP);
        for (let x = 0; x < cols; x++) {
          let h = terrain[y][x];
          if (${params.wireframe}) {
            stroke(getTerrainColor(h));
            strokeWeight(0.5);
            noFill();
          } else {
            fill(getTerrainColor(h));
            noStroke();
          }
          vertex(x * scl, y * scl - rows * scl / 2, h);
          vertex(x * scl, (y+1) * scl - rows * scl / 2, terrain[y+1][x]);
        }
        endShape();
      }

      t += ${params.speed};
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
