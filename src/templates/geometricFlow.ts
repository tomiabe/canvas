import { Template } from '../types';

export const geometricFlowTemplate: Template = {
  id: 'geometric-flow',
  name: 'Geometric Flow',
  description: 'Overlapping translucent geometric shapes in hypnotic motion.',
  params: [
    { id: 'count', name: 'Shape Count', type: 'number', default: 15, min: 3, max: 40, step: 1 },
    { id: 'shape', name: 'Shape Type', type: 'enum', default: 'hexagon', options: ['triangle', 'square', 'hexagon', 'circle', 'star'] },
    { id: 'speed', name: 'Flow Speed', type: 'number', default: 0.5, min: 0.1, max: 3, step: 0.1 },
    { id: 'palette', name: 'Colors', type: 'color-array', default: ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0', '#ffbe0b'] },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a0f' },
    { id: 'opacity', name: 'Opacity', type: 'number', default: 40, min: 5, max: 120, step: 5 },
    { id: 'minSize', name: 'Min Size', type: 'number', default: 50, min: 20, max: 200, step: 10 },
    { id: 'maxSize', name: 'Max Size', type: 'number', default: 200, min: 50, max: 400, step: 10 },
  ],
  presets: [
    { name: 'Neon Hex', params: { count: 12, shape: 'hexagon', speed: 0.4, palette: ['#00ffcc','#ff00cc','#ffcc00'], bgColor: '#000000', opacity: 35, minSize: 60, maxSize: 220 } },
    { name: 'Stardust', params: { count: 20, shape: 'star', speed: 0.7, palette: ['#ffd700','#ff8c00','#ff4500'], bgColor: '#050005', opacity: 50, minSize: 40, maxSize: 160 } },
    { name: 'Sacred Geo', params: { count: 9, shape: 'circle', speed: 0.2, palette: ['#8338ec','#3a86ff'], bgColor: '#000010', opacity: 30, minSize: 80, maxSize: 350 } },
  ],
  generateCode: (params, seed) => `
    let shapes = [];
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      noiseSeed(${seed});
      colorMode(RGB, 255, 255, 255, 255);
      for (let i = 0; i < ${params.count}; i++) {
        shapes.push(newShape(i));
      }
    }

    function newShape(i) {
      return {
        x: random(width), y: random(height),
        size: random(${params.minSize}, ${params.maxSize}),
        rot: random(TWO_PI),
        rotSpeed: random(-0.01, 0.01) * ${params.speed},
        col: palette[i % palette.length],
        noiseX: random(1000), noiseY: random(1000),
      };
    }

    function drawShape(type, x, y, s) {
      if (type === 'triangle') polygon(x, y, s/2, 3);
      else if (type === 'square') { push(); translate(x,y); rotate(PI/4); rect(-s/2, -s/2, s, s); pop(); }
      else if (type === 'hexagon') polygon(x, y, s/2, 6);
      else if (type === 'circle') circle(x, y, s);
      else if (type === 'star') star(x, y, s * 0.4, s * 0.18, 5);
    }

    function polygon(x, y, r, n) {
      beginShape();
      for (let i = 0; i < n; i++) {
        let a = (TWO_PI / n) * i - HALF_PI;
        vertex(x + cos(a) * r, y + sin(a) * r);
      }
      endShape(CLOSE);
    }

    function star(x, y, r1, r2, n) {
      beginShape();
      for (let i = 0; i < n * 2; i++) {
        let a = (PI / n) * i - HALF_PI;
        let r = i % 2 === 0 ? r1 : r2;
        vertex(x + cos(a) * r, y + sin(a) * r);
      }
      endShape(CLOSE);
    }

    function draw() {
      background(0, 0, 0, 8);

      for (let sh of shapes) {
        sh.x += (noise(sh.noiseX) - 0.5) * ${params.speed} * 3;
        sh.y += (noise(sh.noiseY) - 0.5) * ${params.speed} * 3;
        sh.rot += sh.rotSpeed;
        sh.noiseX += 0.006;
        sh.noiseY += 0.006;

        if (sh.x < -sh.size) sh.x = width + sh.size;
        if (sh.x > width + sh.size) sh.x = -sh.size;
        if (sh.y < -sh.size) sh.y = height + sh.size;
        if (sh.y > height + sh.size) sh.y = -sh.size;

        let col = color(sh.col);
        fill(red(col), green(col), blue(col), ${params.opacity});
        stroke(red(col), green(col), blue(col), ${params.opacity} * 1.5);
        strokeWeight(1.5);

        push();
        translate(sh.x, sh.y);
        rotate(sh.rot);
        drawShape('${params.shape}', 0, 0, sh.size);
        pop();
      }
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
