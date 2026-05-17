import { Template } from '../types';

export const truchetTilesTemplate: Template = {
  id: 'truchet-tiles',
  name: 'Truchet Tiles',
  description: 'Randomly tiled arcs that form flowing organic patterns.',
  params: [
    { id: 'tileSize', name: 'Tile Size', type: 'number', default: 40, min: 15, max: 120, step: 5 },
    { id: 'palette', name: 'Colors', type: 'color-array', default: ['#ffffff', '#000000'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#1a1a2e' },
    { id: 'style', name: 'Style', type: 'enum', default: 'arcs', options: ['arcs', 'lines', 'quarter-circles'] },
    { id: 'strokeW', name: 'Line Weight', type: 'number', default: 2, min: 0.5, max: 8, step: 0.5 },
    { id: 'animate', name: 'Animate', type: 'boolean', default: false },
  ],
  presets: [
    { name: 'Classic B&W', params: { tileSize: 50, palette: ['#ffffff', '#000000'], bgColor: '#000000', style: 'arcs', strokeW: 3, animate: false } },
    { name: 'Neon Grid', params: { tileSize: 35, palette: ['#00ffff', '#ff00ff'], bgColor: '#0a0010', style: 'arcs', strokeW: 2, animate: true } },
    { name: 'Wood Grain', params: { tileSize: 30, palette: ['#8B4513', '#deb887', '#d2691e'], bgColor: '#5c3317', style: 'quarter-circles', strokeW: 2, animate: false } },
  ],
  generateCode: (params, seed) => `
    let tiles = [];
    let palette = ${JSON.stringify(params.palette)};
    let ts = ${params.tileSize};
    let t = 0;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      generateTiles();
      if (!${params.animate}) { noLoop(); }
    }

    function generateTiles() {
      tiles = [];
      for (let x = 0; x < width; x += ts) {
        for (let y = 0; y < height; y += ts) {
          tiles.push({ x, y, rot: floor(random(4)) * HALF_PI, col: random(palette) });
        }
      }
    }

    function draw() {
      background('${params.bgColor}');
      for (let tile of tiles) {
        let r = ${params.animate} ? tile.rot + t * 0.02 : tile.rot;
        drawTile(tile.x, tile.y, r, tile.col);
      }
      t++;
    }

    function drawTile(x, y, r, col) {
      push();
      translate(x + ts/2, y + ts/2);
      rotate(r);
      stroke(col);
      strokeWeight(${params.strokeW});
      noFill();
      let style = '${params.style}';
      if (style === 'arcs') {
        arc(-ts/2, -ts/2, ts, ts, 0, HALF_PI);
        arc(ts/2, ts/2, ts, ts, PI, PI + HALF_PI);
      } else if (style === 'lines') {
        line(-ts/2, 0, 0, -ts/2);
        line(0, ts/2, ts/2, 0);
      } else {
        arc(-ts/2, -ts/2, ts, ts, 0, HALF_PI);
        arc(ts/2, -ts/2, ts, ts, HALF_PI, PI);
      }
      pop();
    }

    function mousePressed() { randomSeed(millis()); generateTiles(); if (!${params.animate}) redraw(); }
    function windowResized() { resizeCanvas(windowWidth, windowHeight); generateTiles(); if (!${params.animate}) redraw(); }
  `,
};
