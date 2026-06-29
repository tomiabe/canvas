import { Template } from '../types';

export const swirlTemplate: Template = {
  id: 'swirl',
  name: 'Swirl',
  description: 'Hypnotic conical swirl pattern with color distortion.',
  category: 'color',
  params: [
    { id: 'arms', name: 'Arms', type: 'number', default: 6, min: 2, max: 20, step: 1, category: 'geometry', description: 'Number of spiral arms' },
    { id: 'twist', name: 'Twist', type: 'number', default: 3, min: 1, max: 10, step: 0.5, category: 'geometry', description: 'Twist intensity' },
    { id: 'speed', name: 'Rotation Speed', type: 'number', default: 0.01, min: 0, max: 0.05, step: 0.002, category: 'animation' },
    { id: 'thickness', name: 'Line Thickness', type: 'number', default: 2, min: 0.5, max: 8, step: 0.5, category: 'geometry' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#ff0054', '#ff6b9d', '#c77dff', '#00b4d8', '#00e5ff', '#39ff14'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000', category: 'color' }
  ],
  presets: [
    {
      name: 'Psychedelic',
      params: { arms: 12, twist: 5, speed: 0.02, thickness: 1.5, palette: ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff', '#8b00ff'], bgColor: '#000000' }
    },
    {
      name: 'Water Spiral',
      params: { arms: 4, twist: 2, speed: 0.005, thickness: 3, palette: ['#00b4d8', '#90e0ef', '#caf0f8', '#ffffff'], bgColor: '#03045e' }
    }
  ],
  generateCode: (params, seed) => `
    let palette = ${JSON.stringify(params.palette)};

    function setup() {
      createCanvas(windowWidth, windowHeight);
      background('${params.bgColor}');
    }

    function draw() {
      background('${params.bgColor}');
      translate(width / 2, height / 2);

      let arms = ${params.arms};
      let twist = ${params.twist};
      let thickness = ${params.thickness};
      let rot = frameCount * ${params.speed};
      let maxR = min(width, height) * 0.45;

      noFill();
      strokeWeight(thickness);

      for (let a = 0; a < arms; a++) {
        let angleOffset = (TWO_PI / arms) * a;
        let c = color(palette[a % palette.length]);

        beginShape();
        for (let r = 0; r < maxR; r += 1) {
          let angle = rot + angleOffset + twist * (r / maxR) * TWO_PI;
          let x = cos(angle) * r;
          let y = sin(angle) * r;
          c.setAlpha(map(r, 0, maxR, 200, 50));
          stroke(c);
          vertex(x, y);
        }
        endShape();
      }

      if (${params.speed} === 0) noLoop();
    }

    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
