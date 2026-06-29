import { Template } from '../types';

export const kaleidoscopeTemplate: Template = {
  id: 'kaleidoscope',
  name: 'Kaleidoscope',
  description: 'Interactive kaleidoscope drawing tool with mirror symmetry.',
  category: 'interaction',
  params: [
    { id: 'segments', name: 'Symmetry Segments', type: 'number', default: 12, min: 2, max: 36, step: 1, category: 'geometry', description: 'Number of mirror reflections' },
    { id: 'brushSize', name: 'Brush Size', type: 'number', default: 30, min: 5, max: 150, step: 1, category: 'interaction', description: 'Size of drawing brush' },
    { id: 'opacity', name: 'Opacity', type: 'number', default: 80, min: 10, max: 255, step: 5, category: 'interaction', description: 'Brush stroke opacity' },
    { id: 'autoRotate', name: 'Auto Rotate', type: 'boolean', default: false, category: 'animation', description: 'Slowly rotate the kaleidoscope' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff0054', '#ffbd00', '#00e5ff', '#39ff14', '#c77dff', '#ffffff'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000', category: 'color' }
  ],
  presets: [
    {
      name: 'Butterfly Wings',
      params: { segments: 8, brushSize: 40, opacity: 60, autoRotate: false, palette: ['#ff6b9d', '#c77dff', '#00b4d8', '#ffd700', '#ffffff'], bgColor: '#0a0a0a' }
    },
    {
      name: 'Mandala Maker',
      params: { segments: 24, brushSize: 20, opacity: 100, autoRotate: true, palette: ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff', '#8b00ff'], bgColor: '#000000' }
    }
  ],
  generateCode: (params, seed) => `
    let palette = ${JSON.stringify(params.palette)};
    let currentColor;
    let angle = 0;
    let gBuffer;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      currentColor = random(palette);
      background('${params.bgColor}');
    }

    function draw() {
      let seg = ${params.segments};
      let step = TWO_PI / seg;
      let s = ${params.brushSize};
      let a = ${params.opacity};

      if (${params.autoRotate}) {
        angle += 0.002;
      }

      if (mouseIsPressed && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        let c = color(currentColor);
        c.setAlpha(a);

        push();
        translate(width / 2, height / 2);
        rotate(angle);

        for (let i = 0; i < seg; i++) {
          push();
          rotate(i * step);
          // Draw the main reflection
          let dx = mouseX - width / 2;
          let dy = mouseY - height / 2;
          let d = sqrt(dx * dx + dy * dy);
          let ang = atan2(dy, dx) - angle;
          let mx = cos(ang) * d;
          let my = sin(ang) * d;

          translate(0, 0);
          fill(c);
          noStroke();
          circle(mx, my, s);
          // Mirror
          scale(1, -1);
          fill(c);
          circle(mx, my, s);
          pop();
        }
        pop();
      }
    }

    function mousePressed() {
      currentColor = random(palette);
    }

    function keyPressed() {
      if (key === 'c' || key === 'C') background('${params.bgColor}');
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      background('${params.bgColor}');
    }
  `
};
