import { Template } from '../types';

export const typographyWarpTemplate: Template = {
  id: 'typography-warp',
  name: 'Typography Warp',
  description: 'Text distorted by sine waves.',
  params: [
    { id: 'text', name: 'Text', type: 'enum', default: 'CANVAS', options: ['CANVAS', 'GENERATIVE', 'ART', 'CODE', 'P5JS'] },
    { id: 'fontSize', name: 'Font Size', type: 'number', default: 120, min: 40, max: 300, step: 10 },
    { id: 'waveFreq', name: 'Wave Frequency', type: 'number', default: 0.05, min: 0.01, max: 0.2, step: 0.01 },
    { id: 'waveAmp', name: 'Wave Amplitude', type: 'number', default: 50, min: 0, max: 200, step: 5 },
    { id: 'spacing', name: 'Line Spacing', type: 'number', default: 40, min: 10, max: 100, step: 5 },
    { id: 'textColor', name: 'Text Color', type: 'color', default: '#ffffff' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#111111' }
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
    
    function preload() {
      // Using a default sans-serif font available in browser
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
      
      let txt = '${params.text}';
      let lines = floor(height / ${params.spacing}) + 2;
      
      for (let i = 0; i < lines; i++) {
        let y = i * ${params.spacing};
        
        push();
        translate(width / 2, y);
        
        // Split text into characters to animate them individually
        let chars = txt.split('');
        let totalWidth = textWidth(txt);
        let startX = -totalWidth / 2;
        
        for (let j = 0; j < chars.length; j++) {
          let char = chars[j];
          let charWidth = textWidth(char);
          
          let xOffset = startX + charWidth / 2;
          
          // Calculate wave offset
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
  `
};
