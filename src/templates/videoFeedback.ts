import { Template } from '../types';

export const videoFeedbackTemplate: Template = {
  id: 'video-feedback',
  name: 'Video Feedback',
  description: 'Webcam capture with real-time pixel effects, feedback loops, and glitch aesthetics.',
  category: 'image',
  params: [
    { id: 'effect', name: 'Effect', type: 'enum', default: 'feedback', options: ['feedback', 'pixelate', 'edge-detect', 'posterize', 'rgb-split', 'mirror'], category: 'image', description: 'Visual effect applied to the video' },
    { id: 'intensity', name: 'Effect Intensity', type: 'number', default: 50, min: 5, max: 100, step: 5, category: 'image', description: 'Strength of the visual effect' },
    { id: 'resolution', name: 'Pixel Resolution', type: 'number', default: 8, min: 2, max: 40, step: 2, category: 'image', description: 'Pixelation level (pixels = lower res)' },
    { id: 'feedbackFade', name: 'Feedback Fade', type: 'number', default: 200, min: 50, max: 255, step: 5, category: 'image', description: 'Feedback trail decay rate' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#00e5ff', '#ff0054', '#ffbd00', '#39ff14', '#c77dff'], category: 'color', description: 'Colors for posterize effect' },
    { id: 'mirrorH', name: 'Mirror Horizontal', type: 'boolean', default: true, category: 'image' },
    { id: 'mirrorV', name: 'Mirror Vertical', type: 'boolean', default: false, category: 'image' }
  ],
  presets: [
    {
      name: 'Glitch Portrait',
      params: { effect: 'rgb-split', intensity: 30, resolution: 4, feedbackFade: 220, palette: ['#ff0054', '#00e5ff', '#39ff14'], mirrorH: true, mirrorV: false }
    },
    {
      name: 'Dreamscape',
      params: { effect: 'feedback', intensity: 60, resolution: 6, feedbackFade: 150, palette: ['#ff6b9d', '#c77dff', '#00b4d8'], mirrorH: true, mirrorV: true }
    }
  ],
  generateCode: (params, seed) => `
    let capture;
    let palette = ${JSON.stringify(params.palette)};
    let feedbackBuffer;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      pixelDensity(1);
      capture = createCapture(VIDEO);
      capture.size(width, height);
      capture.hide();
      feedbackBuffer = createGraphics(width, height);
    }

    function draw() {
      let effect = '${params.effect}';
      let intensity = ${params.intensity};
      let res = ${params.resolution};

      capture.loadPixels();

      if (effect === 'feedback') {
        // Feedback loop: blend current frame with previous
        feedbackBuffer.background(0, 255 - ${params.feedbackFade});
        feedbackBuffer.image(capture, 0, 0, width, height);
        // Apply offset feedback
        feedbackBuffer.push();
        feedbackBuffer.translate(width * 0.02, 0);
        feedbackBuffer.tint(255, 100);
        feedbackBuffer.image(feedbackBuffer, 0, 0);
        feedbackBuffer.pop();
        image(feedbackBuffer, 0, 0);
      }

      else if (effect === 'pixelate') {
        loadPixels();
        for (let x = 0; x < width; x += res) {
          for (let y = 0; y < height; y += res) {
            let idx = (x + y * width) * 4;
            if (idx < capture.pixels.length) {
              let r = capture.pixels[idx];
              let g = capture.pixels[idx + 1];
              let b = capture.pixels[idx + 2];
              fill(r, g, b);
              noStroke();
              let s = map(intensity, 0, 100, res, res * 3);
              rect(x, y, s, s);
            }
          }
        }
      }

      else if (effect === 'edge-detect') {
        loadPixels();
        for (let x = 1; x < width - 1; x += 2) {
          for (let y = 1; y < height - 1; y += 2) {
            let idx = (x + y * width) * 4;
            let idxL = ((x - 1) + y * width) * 4;
            let idxR = ((x + 1) + y * width) * 4;
            let idxU = (x + (y - 1) * width) * 4;
            let idxD = (x + (y + 1) * width) * 4;
            let r = abs(capture.pixels[idx] * 4 - capture.pixels[idxL] - capture.pixels[idxR] - capture.pixels[idxU] - capture.pixels[idxD]);
            let g = abs(capture.pixels[idx + 1] * 4 - capture.pixels[idxL + 1] - capture.pixels[idxR + 1] - capture.pixels[idxU + 1] - capture.pixels[idxD + 1]);
            let b = abs(capture.pixels[idx + 2] * 4 - capture.pixels[idxL + 2] - capture.pixels[idxR + 2] - capture.pixels[idxU + 2] - capture.pixels[idxD + 2]);
            let bright = (r + g + b) / 3;
            if (bright * intensity / 100 > 50) {
              stroke(255, bright);
              strokeWeight(1);
              point(x, y);
            }
          }
        }
      }

      else if (effect === 'posterize') {
        loadPixels();
        let numColors = palette.length;
        for (let x = 0; x < width; x += res) {
          for (let y = 0; y < height; y += res) {
            let idx = (x + y * width) * 4;
            if (idx < capture.pixels.length) {
              let r = capture.pixels[idx];
              let g = capture.pixels[idx + 1];
              let b = capture.pixels[idx + 2];
              let bright = (r + g + b) / 3;
              let colorIdx = floor(map(bright, 0, 255, 0, numColors));
              colorIdx = constrain(colorIdx, 0, numColors - 1);
              fill(palette[colorIdx]);
              noStroke();
              rect(x, y, res, res);
            }
          }
        }
      }

      else if (effect === 'rgb-split') {
        let split = map(intensity, 0, 100, 2, 30);
        loadPixels();
        for (let x = 0; x < width; x += 2) {
          for (let y = 0; y < height; y += 2) {
            let idx = (x + y * width) * 4;
            if (idx < capture.pixels.length) {
              let rIdx = ((x + split) + y * width) * 4;
              let gIdx = (x + (y + split) * width) * 4;
              let bIdx = ((x - split) + y * width) * 4;
              let r = rIdx < capture.pixels.length ? capture.pixels[rIdx] : 0;
              let g = gIdx < capture.pixels.length ? capture.pixels[gIdx + 1] : 0;
              let b = bIdx < capture.pixels.length ? capture.pixels[bIdx + 2] : 0;
              fill(r, g, b);
              noStroke();
              rect(x, y, 3, 3);
            }
          }
        }
      }

      else if (effect === 'mirror') {
        push();
        translate(width / 2, 0);
        if (${params.mirrorH}) scale(-1, 1);
        if (${params.mirrorV}) scale(1, -1);
        image(capture, -width / 2, 0, width, height);
        pop();
        push();
        translate(width / 2, 0);
        scale(-1, 1);
        tint(255, map(intensity, 0, 100, 30, 150));
        image(capture, -width / 2, 0, width, height);
        pop();
      }
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
