import { Template } from '../types';

export const dripEffectTemplate: Template = {
  id: 'drip-effect',
  name: 'Drip Effect',
  description: 'Paint dripping and splatter effect with fluid physics.',
  category: 'interaction',
  params: [
    { id: 'dripRate', name: 'Drip Rate', type: 'number', default: 3, min: 1, max: 20, step: 1, category: 'interaction', description: 'How many drops spawn per frame' },
    { id: 'dripSpeed', name: 'Drip Speed', type: 'number', default: 4, min: 1, max: 15, step: 1, category: 'physics', description: 'How fast drops fall' },
    { id: 'maxDrips', name: 'Max Drips', type: 'number', default: 500, min: 50, max: 2000, step: 50, category: 'layout', description: 'Maximum number of drips on screen' },
    { id: 'splatter', name: 'Splatter Size', type: 'number', default: 10, min: 2, max: 30, step: 2, category: 'interaction', description: 'Size of splatter marks' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff0054', '#ffbd00', '#00e5ff', '#39ff14', '#c77dff'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#f5f0e8', category: 'color' }
  ],
  presets: [
    {
      name: 'Rainbow Drip',
      params: { dripRate: 5, dripSpeed: 3, maxDrips: 800, splatter: 15, palette: ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff', '#8b00ff'], bgColor: '#f5f0e8' }
    },
    {
      name: 'Ink Bleed',
      params: { dripRate: 1, dripSpeed: 2, maxDrips: 200, splatter: 8, palette: ['#000000', '#222222', '#444444'], bgColor: '#f0f0f0' }
    }
  ],
  generateCode: (params, seed) => `
    let drips = [];
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      background('${params.bgColor}');
      noStroke();
    }

    function draw() {
      let maxDrips = ${params.maxDrips};

      // Spawn new drips
      if (drips.length < maxDrips) {
        for (let i = 0; i < ${params.dripRate}; i++) {
          if (drips.length >= maxDrips) break;
          drips.push({
            x: random(width),
            y: random(-50, 0),
            speed: random(${params.dripSpeed} * 0.5, ${params.dripSpeed} * 1.5),
            size: random(3, ${params.splatter}),
            color: random(palette),
            wobble: random(-0.5, 0.5)
          });
        }
      }

      for (let i = drips.length - 1; i >= 0; i--) {
        let d = drips[i];
        d.x += d.wobble;
        d.y += d.speed;

        // Splatter on ground
        if (d.y > height - d.size) {
          fill(d.color);
          for (let s = 0; s < 5; s++) {
            let sx = d.x + random(-d.size, d.size);
            let sy = height - random(0, d.size);
            circle(sx, sy, random(1, d.size * 0.5));
          }
          drips.splice(i, 1);
          continue;
        }

        // Draw drip
        let alpha = map(d.y, -50, height, 255, 180);
        let c = color(d.color);
        c.setAlpha(alpha);
        fill(c);
        ellipse(d.x, d.y, d.size * 0.6, d.size);

        // Trail
        fill(c);
        for (let t = 1; t < 3; t++) {
          let ty = d.y - t * d.size * 0.3;
          if (ty > 0) {
            let ta = alpha * (1 - t * 0.2);
            c.setAlpha(ta);
            fill(c);
            ellipse(d.x + random(-0.5, 0.5), ty, d.size * (0.4 - t * 0.1), d.size * 0.3);
          }
        }
      }
    }

    function mouseDragged() {
      let c = color(random(palette));
      c.setAlpha(200);
      fill(c);
      noStroke();
      for (let i = 0; i < 10; i++) {
        circle(mouseX + random(-${params.splatter}, ${params.splatter}), mouseY + random(-${params.splatter}, ${params.splatter}), random(2, ${params.splatter}));
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
