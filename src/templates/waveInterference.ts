import { Template } from '../types';

export const waveInterferenceTemplate: Template = {
  id: 'wave-interference',
  name: 'Wave Interference',
  description: 'Multiple wave sources interfering to create stunning moiré-like patterns.',
  params: [
    { id: 'sources', name: 'Wave Sources', type: 'number', default: 3, min: 1, max: 6, step: 1 },
    { id: 'wavelength', name: 'Wavelength', type: 'number', default: 60, min: 20, max: 200, step: 5 },
    { id: 'speed', name: 'Wave Speed', type: 'number', default: 2, min: 0.5, max: 8, step: 0.5 },
    { id: 'palette', name: 'Colors', type: 'color-array', default: ['#0000aa', '#0066ff', '#00ccff', '#ffffff', '#ff6600', '#cc0000'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000011' },
    { id: 'resolution', name: 'Resolution', type: 'number', default: 4, min: 2, max: 10, step: 1 },
    { id: 'animate', name: 'Animate', type: 'boolean', default: true },
  ],
  presets: [
    { name: 'Ripple Tank', params: { sources: 2, wavelength: 80, speed: 3, palette: ['#000033','#0044aa','#0088ff','#44ccff','#88eeff','#ffffff'], bgColor: '#000022', resolution: 4, animate: true } },
    { name: 'Psychedelic', params: { sources: 4, wavelength: 50, speed: 5, palette: ['#ff0000','#ff8800','#ffff00','#00ff00','#0000ff','#ff00ff'], bgColor: '#000000', resolution: 5, animate: true } },
    { name: 'Frozen', params: { sources: 5, wavelength: 70, speed: 1, palette: ['#001133','#003388','#0066cc','#4499ee','#88ccff','#ffffff'], bgColor: '#000011', resolution: 3, animate: false } },
  ],
  generateCode: (params, seed) => `
    let t = 0;
    let sources = [];
    let palette = ${JSON.stringify(params.palette)};
    let res = ${params.resolution};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      placeSources();
    }

    function placeSources() {
      sources = [];
      for (let i = 0; i < ${params.sources}; i++) {
        let a = (TWO_PI / ${params.sources}) * i;
        let r = min(width, height) * 0.3;
        sources.push({
          x: width/2 + cos(a) * r,
          y: height/2 + sin(a) * r
        });
      }
    }

    function draw() {
      for (let x = 0; x < width; x += res) {
        for (let y = 0; y < height; y += res) {
          let sum = 0;
          for (let s of sources) {
            let d = dist(x, y, s.x, s.y);
            sum += sin(TWO_PI * d / ${params.wavelength} - t);
          }
          let norm = map(sum, -${params.sources}, ${params.sources}, 0, 1);
          let idx = floor(norm * (palette.length - 1));
          let frac = norm * (palette.length - 1) - idx;
          let c1 = color(palette[min(idx, palette.length-1)]);
          let c2 = color(palette[min(idx+1, palette.length-1)]);
          fill(lerpColor(c1, c2, frac));
          noStroke();
          rect(x, y, res, res);
        }
      }
      if (${params.animate}) t += 0.05 * ${params.speed};
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); placeSources(); }
  `,
};
