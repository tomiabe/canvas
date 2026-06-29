import { Template } from '../types';

export const asciiRenderTemplate: Template = {
  id: 'ascii-render',
  name: 'ASCII Render',
  description: 'Live canvas rendered as ASCII text art.',
  category: 'image',
  params: [
    { id: 'characterSet', name: 'Character Set', type: 'enum', default: 'standard', options: ['standard', 'dense', 'minimal', 'blocks', 'custom'], category: 'image', description: 'ASCII characters to use' },
    { id: 'resolution', name: 'Resolution', type: 'number', default: 8, min: 4, max: 20, step: 2, category: 'layout', suffix: 'px', description: 'Size of each character cell' },
    { id: 'animate', name: 'Animate Pattern', type: 'boolean', default: true, category: 'animation', description: 'Animate the source pattern' },
    { id: 'textColor', name: 'Text Color', type: 'color', default: '#00ff88', category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000', category: 'color' }
  ],
  presets: [
    { name: 'Matrix Code', params: { characterSet: 'standard', resolution: 8, animate: true, textColor: '#00ff00', bgColor: '#000000' } },
    { name: 'Mona Lisa', params: { characterSet: 'dense', resolution: 6, animate: false, textColor: '#ffffff', bgColor: '#000000' } },
  ],
  generateCode: (params, seed) => `
    let chars = [];
    let cellSize = ${params.resolution};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      textFont('monospace');
      textSize(cellSize);
      textAlign(CENTER, CENTER);

      let set = '${params.characterSet}';
      if (set === 'standard') chars = ' .:-=+*#%@'.split('');
      else if (set === 'dense') chars = ' .:-=+*#%@MW&8%B@$'.split('');
      else if (set === 'minimal') chars = ' .oO0@'.split('');
      else if (set === 'blocks') chars = [' ', '\\u2591', '\\u2592', '\\u2593', '\\u2588'];
      else chars = ' .-:=+*#%@'.split('');
    }

    function getChar(brightness) {
      let idx = floor(map(brightness, 0, 255, 0, chars.length - 1));
      return chars[constrain(idx, 0, chars.length - 1)];
    }

    function draw() {
      background('${params.bgColor}');
      fill('${params.textColor}');
      noStroke();

      // Draw animated source pattern
      let time = frameCount * 0.02;

      for (let y = 0; y < height; y += cellSize) {
        for (let x = 0; x < width; x += cellSize) {
          let bright;
          if (${params.animate}) {
            let n = noise(x * 0.01, y * 0.01, time);
            bright = n * 255;
          } else {
            bright = (sin(x * 0.02) * cos(y * 0.02) * 0.5 + 0.5) * 255;
          }
          text(getChar(bright), x + cellSize / 2, y + cellSize / 2);
        }
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
