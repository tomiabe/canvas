import { Template } from '../types';

export const interactivePlaygroundTemplate: Template = {
  id: 'interactive-playground',
  name: 'Interactive Playground',
  description: 'Multi-input interactive sketch responding to mouse, keyboard, and webcam motion.',
  category: 'interaction',
  params: [
    { id: 'mode', name: 'Interaction Mode', type: 'enum', default: 'mouse-trails', options: ['mouse-trails', 'keyboard-grid', 'motion-paint', 'particle-follow', 'gravity-well'], category: 'interaction', description: 'Type of interaction' },
    { id: 'size', name: 'Element Size', type: 'number', default: 20, min: 5, max: 100, step: 5, category: 'interaction', suffix: 'px', description: 'Size of interactive elements' },
    { id: 'speed', name: 'Response Speed', type: 'number', default: 0.1, min: 0.01, max: 0.5, step: 0.02, category: 'animation', description: 'How quickly elements respond' },
    { id: 'trailLength', name: 'Trail Length', type: 'number', default: 20, min: 1, max: 100, step: 1, category: 'animation', description: 'Length of motion trails' },
    { id: 'useWebcam', name: 'Use Webcam', type: 'boolean', default: false, category: 'interaction', description: 'Enable webcam for motion detection' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a0a', category: 'color' }
  ],
  presets: [
    {
      name: 'Light Painting',
      params: { mode: 'mouse-trails', size: 30, speed: 0.05, trailLength: 50, useWebcam: false, palette: ['#ff0054', '#ffbd00', '#00e5ff', '#39ff14'], bgColor: '#000000' }
    },
    {
      name: 'Motion Dance',
      params: { mode: 'particle-follow', size: 15, speed: 0.3, trailLength: 10, useWebcam: true, palette: ['#00b4d8', '#90e0ef', '#caf0f8', '#ffffff'], bgColor: '#03045e' }
    }
  ],
  generateCode: (params, seed) => `
    let palette = ${JSON.stringify(params.palette)};
    let particles = [];
    let trail = [];
    let capture;
    let motion = createVector(0, 0);
    let prevFrame = [];

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      if (${params.useWebcam}) {
        capture = createCapture(VIDEO);
        capture.size(width, height);
        capture.hide();
        prevFrame = new Array(width * height * 4).fill(0);
      }
      for (let i = 0; i < 200; i++) {
        particles.push({
          x: random(width),
          y: random(height),
          vx: random(-1, 1),
          vy: random(-1, 1),
          color: random(palette)
        });
      }
    }

    function draw() {
      let mode = '${params.mode}';
      let size = ${params.size};
      let speed = ${params.speed};
      let trailLen = ${params.trailLength};

      if (${params.useWebcam} && capture) {
        capture.loadPixels();
        if (capture.pixels && prevFrame.length > 0) {
          let totalMotion = 0;
          let mx = 0, my = 0, count = 0;
          let step = 20;
          for (let x = 0; x < width; x += step) {
            for (let y = 0; y < height; y += step) {
              let idx = (x + y * width) * 4;
              let diff = abs(capture.pixels[idx] - prevFrame[idx]) +
                         abs(capture.pixels[idx+1] - prevFrame[idx+1]) +
                         abs(capture.pixels[idx+2] - prevFrame[idx+2]);
              if (diff > 100) {
                totalMotion += diff;
                mx += x; my += y; count++;
              }
            }
          }
          if (count > 0) {
            motion.x = lerp(motion.x, mx / count, 0.3) - width/2;
            motion.y = lerp(motion.y, my / count, 0.3) - height/2;
          }
          prevFrame = [...capture.pixels];
        }
      } else {
        motion.x = mouseX - width/2;
        motion.y = mouseY - height/2;
      }

      if (mode === 'mouse-trails') {
        let bg = color('${params.bgColor}');
        background(bg.levels[0], bg.levels[1], bg.levels[2], 255 - trailLen * 2);

        if (mouseIsPressed || (${params.useWebcam} && count > 0)) {
          trail.push({ x: mouseX, y: mouseY });
          if (trail.length > trailLen) trail.shift();
        }

        for (let i = 0; i < trail.length - 1; i++) {
          let a = map(i, 0, trail.length, 0, 255);
          let c = color(palette[i % palette.length]);
          c.setAlpha(a);
          stroke(c);
          strokeWeight(map(i, 0, trail.length, 1, size * 0.5));
          line(trail[i].x, trail[i].y, trail[i+1].x, trail[i+1].y);
        }
      }

      else if (mode === 'keyboard-grid') {
        background('${params.bgColor}');
        let cols = floor(width / size);
        let rows = floor(height / size);
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            let x = i * size + size/2;
            let y = j * size + size/2;
            let d = dist(x, y, mouseX, mouseY);
            let pulse = sin(frameCount * 0.05 + d * 0.02) * 0.5 + 0.5;
            let s = map(d, 0, width * 0.5, size, size * 0.2) * pulse;
            let c = color(palette[(i + j) % palette.length]);
            noStroke();
            fill(c);
            rectMode(CENTER);
            rect(x, y, s, s);
          }
        }
      }

      else if (mode === 'motion-paint') {
        background('${params.bgColor}');
        let mx = motion.x + width/2;
        let my = motion.y + height/2;
        for (let i = 0; i < 10; i++) {
          let c = color(random(palette));
          c.setAlpha(100);
          fill(c);
          noStroke();
          circle(mx + random(-size, size), my + random(-size, size), random(size * 0.2, size));
        }
      }

      else if (mode === 'particle-follow') {
        let bg = color('${params.bgColor}');
        background(bg.levels[0], bg.levels[1], bg.levels[2], 50);
        let targetX = motion.x + width/2;
        let targetY = motion.y + height/2;

        for (let p of particles) {
          let dx = targetX - p.x;
          let dy = targetY - p.y;
          p.vx += dx * speed * 0.01;
          p.vy += dy * speed * 0.01;
          p.vx *= 0.95;
          p.vy *= 0.95;
          p.x += p.vx;
          p.y += p.vy;

          let c = color(p.color);
          c.setAlpha(150);
          noStroke();
          fill(c);
          circle(p.x, p.y, size * 0.3);
        }
      }

      else if (mode === 'gravity-well') {
        background('${params.bgColor}');
        let mx = motion.x + width/2;
        let my = motion.y + height/2;

        for (let p of particles) {
          let dx = mx - p.x;
          let dy = my - p.y;
          let d = sqrt(dx*dx + dy*dy);
          if (d > 0) {
            let force = 100 / (d * d);
            p.vx += (dx / d) * force;
            p.vy += (dy / d) * force;
          }
          p.vx *= 0.99;
          p.vy *= 0.99;
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          let c = color(p.color);
          c.setAlpha(200);
          noStroke();
          fill(c);
          circle(p.x, p.y, size * 0.3);
        }
      }
    }

    function keyPressed() {
      if (key === 'c' || key === 'C') background('${params.bgColor}');
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
