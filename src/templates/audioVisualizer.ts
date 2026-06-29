import { Template } from '../types';

export const audioVisualizerTemplate: Template = {
  id: 'audio-visualizer',
  name: 'Audio Visualizer',
  description: 'Sound-reactive visualization using p5.sound FFT analysis. Enable mic or use the built-in oscillator.',
  category: 'audio',
  params: [
    { id: 'mode', name: 'Visualizer Mode', type: 'enum', default: 'bars', options: ['bars', 'radial', 'waveform', 'particles', 'rings'], category: 'audio', description: 'Style of the visualization' },
    { id: 'sensitivity', name: 'Sensitivity', type: 'number', default: 2, min: 0.5, max: 5, step: 0.5, category: 'audio', description: 'Reactivity to sound input' },
    { id: 'smooth', name: 'Smoothing', type: 'number', default: 0.7, min: 0.1, max: 0.95, step: 0.05, category: 'audio', description: 'How smooth the visual response is' },
    { id: 'useMic', name: 'Use Microphone', type: 'boolean', default: true, category: 'audio', description: 'Use mic input (off = built-in oscillator)' },
    { id: 'barCount', name: 'Bar Count', type: 'number', default: 64, min: 8, max: 256, step: 8, category: 'layout', description: 'Number of frequency bands' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff0054', '#ff6b9d', '#c77dff', '#00b4d8', '#00e5ff'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#050510', category: 'color' }
  ],
  presets: [
    {
      name: 'Nightclub',
      params: { mode: 'radial', sensitivity: 3, smooth: 0.6, useMic: true, barCount: 128, palette: ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff', '#8b00ff'], bgColor: '#000000' }
    },
    {
      name: 'Ambient Waves',
      params: { mode: 'waveform', sensitivity: 1, smooth: 0.9, useMic: false, barCount: 32, palette: ['#00b4d8', '#90e0ef', '#caf0f8'], bgColor: '#03045e' }
    }
  ],
  generateCode: (params, seed) => `
    let fft;
    let oscillator;
    let palette = ${JSON.stringify(params.palette)};
    let particles = [];

    function setup() {
      createCanvas(windowWidth, windowHeight);
      colorMode(HSB, 360, 100, 100, 255);

      fft = new p5.FFT(${params.smooth}, ${params.barCount});

      if (${params.useMic}) {
        let mic = new p5.AudioIn();
        mic.start();
        fft.setInput(mic);
      } else {
        oscillator = new p5.Oscillator('sine');
        oscillator.start();
        oscillator.amp(0.5);
        fft.setInput(oscillator);
      }

      if ('${params.mode}' === 'particles') {
        for (let i = 0; i < 100; i++) {
          particles.push({ x: random(width), y: random(height), vx: random(-1, 1), vy: random(-1, 1) });
        }
      }
    }

    function draw() {
      background('${params.bgColor}');
      let spectrum = fft.analyze();
      let waveform = fft.waveform();
      let sens = ${params.sensitivity};
      let mode = '${params.mode}';

      noStroke();

      if (mode === 'bars') {
        let barW = width / spectrum.length;
        for (let i = 0; i < spectrum.length; i++) {
          let amp = spectrum[i] * sens;
          let h = map(amp, 0, 255, 0, height * 0.8);
          let c = color(palette[i % palette.length]);
          fill(c);
          rect(i * barW, height - h, barW - 1, h);
        }
      }

      else if (mode === 'radial') {
        translate(width / 2, height / 2);
        let angleStep = TWO_PI / spectrum.length;
        for (let i = 0; i < spectrum.length; i++) {
          let amp = spectrum[i] * sens;
          let r = map(amp, 0, 255, 20, min(width, height) * 0.4);
          let c = color(palette[i % palette.length]);
          fill(c);
          let x = cos(i * angleStep) * r;
          let y = sin(i * angleStep) * r;
          circle(x, y, map(amp, 0, 255, 2, 20));
        }
      }

      else if (mode === 'waveform') {
        strokeWeight(2);
        noFill();
        beginShape();
        for (let i = 0; i < waveform.length; i++) {
          let x = map(i, 0, waveform.length, 0, width);
          let y = map(waveform[i], -1, 1, 0, height);
          let c = color(palette[i % palette.length]);
          stroke(c);
          vertex(x, y);
        }
        endShape();
      }

      else if (mode === 'particles') {
        let energy = 0;
        for (let i = 0; i < spectrum.length; i++) energy += spectrum[i];
        energy /= spectrum.length;
        let force = map(energy, 0, 255, 0, 5) * sens;

        for (let p of particles) {
          p.vx += random(-0.2, 0.2) * force;
          p.vy += random(-0.2, 0.2) * force;
          p.vx *= 0.98;
          p.vy *= 0.98;
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
          let c = color(palette[floor(random(palette.length))]);
          fill(c);
          circle(p.x, p.y, map(energy, 0, 255, 2, 8));
        }
      }

      else if (mode === 'rings') {
        translate(width / 2, height / 2);
        let bands = min(spectrum.length, 64);
        for (let i = 0; i < bands; i++) {
          let amp = spectrum[i] * sens;
          let r = map(i, 0, bands, 10, min(width, height) * 0.45);
          let thick = map(amp, 0, 255, 0.5, 10);
          let c = color(palette[i % palette.length]);
          noFill();
          stroke(c);
          strokeWeight(thick);
          circle(0, 0, r * 2);
        }
      }

      if (!${params.useMic} && oscillator) {
        let freq = map(mouseX, 0, width, 100, 1000);
        oscillator.freq(freq);
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
