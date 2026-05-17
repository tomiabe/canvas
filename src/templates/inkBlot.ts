import { Template } from '../types';

export const inkBlotTemplate: Template = {
  id: 'ink-blot',
  name: 'Symmetry Ink',
  description: 'Mirrored ink-blot art — everything you paint is reflected symmetrically.',
  params: [
    { id: 'axes', name: 'Mirror Axes', type: 'number', default: 4, min: 1, max: 12, step: 1 },
    { id: 'inkSize', name: 'Brush Size', type: 'number', default: 8, min: 2, max: 40, step: 1 },
    { id: 'inkColor', name: 'Ink Color', type: 'color', default: '#ffffff' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000' },
    { id: 'fade', name: 'Auto Fade', type: 'boolean', default: false },
    { id: 'flow', name: 'Auto Flow', type: 'boolean', default: true },
    { id: 'flowPalette', name: 'Flow Colors', type: 'color-array', default: ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0', '#ffbe0b'] },
  ],
  presets: [
    { name: 'Rorschach', params: { axes: 2, inkSize: 10, inkColor: '#000000', bgColor: '#ffffff', fade: false, flow: true, flowPalette: ['#000000','#222222'] } },
    { name: 'Mandala Paint', params: { axes: 8, inkSize: 6, inkColor: '#ff00cc', bgColor: '#000000', fade: false, flow: true, flowPalette: ['#ff00cc','#cc00ff','#6600ff','#0066ff'] } },
    { name: 'Rainbow Mirror', params: { axes: 6, inkSize: 8, inkColor: '#ff0000', bgColor: '#0a0a0a', fade: false, flow: true, flowPalette: ['#ff0000','#ff8800','#ffff00','#00ff00','#0000ff','#ff00ff'] } },
  ],
  generateCode: (params, seed) => `
    let flowAngle = 0, flowX, flowY, flowPalette = ${JSON.stringify(params.flowPalette)};
    let palIdx = 0, palT = 0;

    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      noiseSeed(${seed});
      background('${params.bgColor}');
      flowX = width/2;
      flowY = height/2;
    }

    function drawMirrored(x, y, px, py, col, sz) {
      let axes = ${params.axes};
      let cx = width/2, cy = height/2;
      let dx = x - cx, dy = y - cy;
      let pdx = px - cx, pdy = py - cy;

      for (let i = 0; i < axes; i++) {
        let a = (TWO_PI / axes) * i;
        let rx  = cx + dx * cos(a) - dy * sin(a);
        let ry  = cy + dx * sin(a) + dy * cos(a);
        let prx = cx + pdx * cos(a) - pdy * sin(a);
        let pry = cy + pdx * sin(a) + pdy * cos(a);
        stroke(col);
        strokeWeight(sz);
        line(prx, pry, rx, ry);

        // Mirror
        let mx = cx - (rx - cx);
        let pmx = cx - (prx - cx);
        line(pmx, pry, mx, ry);
      }
    }

    function draw() {
      if (${params.fade}) background(0, 0, 0, 5);

      if (${params.flow}) {
        palT++;
        if (palT > 30) { palIdx = (palIdx + 1) % flowPalette.length; palT = 0; }
        let col = color(flowPalette[palIdx]);

        let prevX = flowX, prevY = flowY;
        flowAngle += (noise(flowX * 0.003, flowY * 0.003) - 0.5) * 0.3;
        flowX += cos(flowAngle) * 3;
        flowY += sin(flowAngle) * 3;

        if (flowX < 10) { flowX = 10; flowAngle += PI; }
        if (flowX > width-10) { flowX = width-10; flowAngle += PI; }
        if (flowY < 10) { flowY = 10; flowAngle += PI; }
        if (flowY > height-10) { flowY = height-10; flowAngle += PI; }

        drawMirrored(flowX, flowY, prevX, prevY, col, ${params.inkSize});
      }

      if (mouseIsPressed) {
        let col = color('${params.inkColor}');
        drawMirrored(mouseX, mouseY, pmouseX, pmouseY, col, ${params.inkSize});
      }
    }

    function keyPressed() {
      if (key === ' ') { background('${params.bgColor}'); }
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
