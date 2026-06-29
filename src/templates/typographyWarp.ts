import { Template } from '../types';

export const typographyWarpTemplate: Template = {
  id: 'typography-warp',
  name: 'Typography Warp',
  description: 'Text distorted by sine waves.',
  category: 'typography',
  params: [
    { id: 'text', name: 'Text', type: 'string', default: 'CANVAS', category: 'typography', description: 'Custom text to display' },
    { id: 'fontSize', name: 'Font Size', type: 'number', default: 120, min: 40, max: 300, step: 10, category: 'typography', suffix: 'px', description: 'Size of the text' },
    { id: 'waveFreq', name: 'Wave Frequency', type: 'number', default: 0.05, min: 0.01, max: 0.2, step: 0.01, category: 'animation', description: 'Frequency of the distortion wave' },
    { id: 'waveAmp', name: 'Wave Amplitude', type: 'number', default: 50, min: 0, max: 200, step: 5, category: 'animation', description: 'Intensity of the wave distortion' },
    { id: 'spacing', name: 'Line Spacing', type: 'number', default: 40, min: 10, max: 100, step: 5, category: 'layout', description: 'Vertical gap between lines' },
    { id: 'textColor', name: 'Text Color', type: 'color', default: '#ffffff', category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#111111', category: 'color' }
  ],
  presets: [
    {
      name: 'Gentle Breeze',
      params: { text: 'ART', fontSize: 150, waveFreq: 0.02, waveAmp: 20, spacing: 60, textColor: '#a8dadc', bgColor: '#1d3557' }
    },
    {
      name: 'Glitch',
      params: { text: 'CODE', fontSize: 200, waveFreq: 0.15, waveAmp: 100, spacing: 30, textColor: '#39ff14', bgColor: '#000000' }
    }
  ],
  generateCode: (params, seed) => `
    let font;
    let points = [];
    let bounds;
    let txt = ${JSON.stringify(params.text)};

    function preload() {
    }

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      textFont('Helvetica');
      textSize(${params.fontSize});
      textAlign(CENTER, CENTER);
    }

    function draw() {
      background('${params.bgColor}');
      fill('${params.textColor}');
      noStroke();

      let lines = floor(height / ${params.spacing}) + 2;

      for (let i = 0; i < lines; i++) {
        let y = i * ${params.spacing};

        push();
        translate(width / 2, y);

        let chars = txt.split('');
        let totalWidth = textWidth(txt);
        let startX = -totalWidth / 2;

        for (let j = 0; j < chars.length; j++) {
          let char = chars[j];
          let charWidth = textWidth(char);

          let xOffset = startX + charWidth / 2;

          let waveY = sin(frameCount * 0.05 + i * 0.5 + j * ${params.waveFreq}) * ${params.waveAmp};

          text(char, xOffset, waveY);
          startX += charWidth;
        }

        pop();
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `,
};
