import { Template } from '../types';

export const bubblesTemplate: Template = {
  id: 'bubbles',
  name: 'Floating Bubbles',
  description: 'Iridescent bubbles drifting upward with gentle physics.',
  params: [
    { id: 'count', name: 'Bubble Count', type: 'number', default: 40, min: 5, max: 150, step: 5 },
    { id: 'maxSize', name: 'Max Size', type: 'number', default: 80, min: 20, max: 200, step: 10 },
    { id: 'speed', name: 'Rise Speed', type: 'number', default: 1.5, min: 0.3, max: 5, step: 0.1 },
    { id: 'palette', name: 'Tint Colors', type: 'color-array', default: ['#ff88cc', '#88ccff', '#88ffcc', '#ffcc88', '#cc88ff'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#001122' },
    { id: 'wobble', name: 'Wobble', type: 'boolean', default: true },
  ],
  presets: [
    { name: 'Soap', params: { count: 30, maxSize: 90, speed: 1, palette: ['#ffccee','#cceeff','#eeffcc','#ffeedd'], bgColor: '#000811', wobble: true } },
    { name: 'Deep Sea', params: { count: 60, maxSize: 50, speed: 0.8, palette: ['#004488','#0066cc','#0088ff','#44aaff'], bgColor: '#000614', wobble: true } },
    { name: 'Candy', params: { count: 50, maxSize: 70, speed: 2, palette: ['#ff69b4','#ff1493','#ff8c00','#ffd700','#00bfff'], bgColor: '#0a0010', wobble: false } },
  ],
  generateCode: (params, seed) => `
    let bubbles = [];
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      for (let i = 0; i < ${params.count}; i++) {
        bubbles.push(newBubble(random(height)));
      }
    }

    function newBubble(startY) {
      return {
        x: random(width),
        y: startY,
        r: random(10, ${params.maxSize}),
        speed: random(0.5, ${params.speed} * 1.5),
        wobblePhase: random(TWO_PI),
        col: random(palette),
        opacity: random(80, 180),
      };
    }

    function draw() {
      background('${params.bgColor}');

      for (let b of bubbles) {
        let wx = ${params.wobble} ? sin(frameCount * 0.02 + b.wobblePhase) * 1.5 : 0;
        b.x += wx;
        b.y -= b.speed;

        if (b.y < -b.r) {
          let nb = newBubble(height + b.r);
          Object.assign(b, nb);
        }

        let col = color(b.col);

        // Glow
        noStroke();
        fill(red(col), green(col), blue(col), b.opacity * 0.15);
        circle(b.x, b.y, b.r * 2.6);

        // Main bubble body
        fill(red(col), green(col), blue(col), b.opacity * 0.12);
        stroke(red(col), green(col), blue(col), b.opacity * 0.7);
        strokeWeight(1.5);
        circle(b.x, b.y, b.r * 2);

        // Specular highlight
        noStroke();
        fill(255, 255, 255, b.opacity * 0.6);
        let hx = b.x - b.r * 0.3, hy = b.y - b.r * 0.3;
        ellipse(hx, hy, b.r * 0.4, b.r * 0.25);

        // Small secondary highlight
        fill(255, 255, 255, b.opacity * 0.3);
        circle(b.x + b.r * 0.2, b.y + b.r * 0.25, b.r * 0.15);
      }
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
