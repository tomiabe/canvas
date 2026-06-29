import { Template } from '../types';

export const truchetTilesTemplate: Template = {
  id: 'truchet-tiles',
  name: 'Truchet Tiles',
  description: 'Procedural tiling patterns using Truchet tile arrangements.',
  category: 'geometry',
  params: [
    { id: 'tileSize', name: 'Tile Size', type: 'number', default: 40, min: 10, max: 120, step: 5, category: 'layout', suffix: 'px', description: 'Size of each tile' },
    { id: 'pattern', name: 'Pattern', type: 'enum', default: 'diagonal', options: ['diagonal', 'circles', 'waves', 'crosses', 'random'], category: 'geometry', description: 'Tile pattern style' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#1a1a2e', '#e94560', '#0f3460', '#16213e'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0f0f1a', category: 'color' },
    { id: 'animated', name: 'Animated', type: 'boolean', default: false, category: 'animation', description: 'Slow rotation animation' }
  ],
  presets: [
    {
      name: 'Classic',
      params: { tileSize: 50, pattern: 'diagonal', palette: ['#2b2d42', '#8d99ae', '#edf2f4'], bgColor: '#edf2f4', animated: false }
    },
    {
      name: 'Op Art',
      params: { tileSize: 30, pattern: 'circles', palette: ['#000000', '#ffffff'], bgColor: '#000000', animated: true }
    }
  ],
  generateCode: (params, seed) => `
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      noLoop();
      if (${params.animated}) loop();
    }

    function drawTiles() {
      background('${params.bgColor}');
      noStroke();
      let size = ${params.tileSize};
      let pattern = '${params.pattern}';
      let anim = ${params.animated};

      for (let x = 0; x < width; x += size) {
        for (let y = 0; y < height; y += size) {
          push();
          translate(x + size / 2, y + size / 2);

          let variant = floor(random(2));
          if (pattern === 'random') {
            variant = floor(random(5));
          }

          if (anim) {
            rotate(frameCount * 0.01 * (variant % 2 === 0 ? 1 : -1));
          } else {
            rotate(variant * HALF_PI);
          }

          let c1 = random(palette);
          let c2 = random(palette);

          if (pattern === 'diagonal' || pattern === 'random') {
            fill(c1);
            triangle(-size / 2, -size / 2, size / 2, -size / 2, size / 2, size / 2);
            fill(c2);
            triangle(-size / 2, -size / 2, -size / 2, size / 2, size / 2, size / 2);
          }

          if ((pattern === 'circles' || pattern === 'random') && variant < 2) {
            fill(c1);
            arc(-size / 2, -size / 2, size, size, 0, HALF_PI);
            fill(c2);
            arc(size / 2, size / 2, size, size, PI, PI + HALF_PI);
          }

          if ((pattern === 'crosses' || pattern === 'random') && variant < 2) {
            fill(c1);
            rect(-size / 4, -size / 2, size / 2, size);
            fill(c2);
            rect(-size / 2, -size / 4, size, size / 2);
          }

          if ((pattern === 'waves' || pattern === 'random') && variant < 2) {
            fill(c1);
            ellipse(-size / 4, 0, size / 2, size);
            fill(c2);
            ellipse(size / 4, 0, size / 2, size);
          }

          pop();
        }
      }
    }

    function draw() {
      if (${params.animated}) {
        randomSeed(${seed});
      }
      drawTiles();
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      drawTiles();
    }
  `
};
