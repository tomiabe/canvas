import { Template } from '../types';

export const webglGeometryTemplate: Template = {
  id: 'webgl-geometry',
  name: '3D Geometry',
  description: 'Rotating 3D shapes with dynamic lighting in WEBGL mode.',
  params: [
    { id: 'shape', name: 'Shape', type: 'enum', default: 'torus', options: ['torus', 'sphere', 'box', 'cone', 'cylinder', 'torusknot'] },
    { id: 'rotSpeed', name: 'Rotation Speed', type: 'number', default: 0.5, min: 0, max: 3, step: 0.05 },
    { id: 'shapeColor', name: 'Shape Color', type: 'color', default: '#6c63ff' },
    { id: 'lightColor', name: 'Light Color', type: 'color', default: '#ffffff' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#0a0a1a' },
    { id: 'wireframe', name: 'Wireframe', type: 'boolean', default: false },
    { id: 'size', name: 'Size', type: 'number', default: 150, min: 50, max: 350, step: 10 },
  ],
  presets: [
    { name: 'Neon Torus', params: { shape: 'torus', rotSpeed: 0.8, shapeColor: '#ff00ff', lightColor: '#00ffff', bgColor: '#000000', wireframe: false, size: 180 } },
    { name: 'Crystal Cube', params: { shape: 'box', rotSpeed: 0.3, shapeColor: '#88ccff', lightColor: '#ffffff', bgColor: '#001122', wireframe: true, size: 200 } },
    { name: 'Golden Sphere', params: { shape: 'sphere', rotSpeed: 0.4, shapeColor: '#f5a623', lightColor: '#fff5cc', bgColor: '#1a0a00', wireframe: false, size: 220 } },
  ],
  generateCode: (params, seed) => `
    let angle = 0;

    function setup() {
      createCanvas(windowWidth, windowHeight, WEBGL);
      randomSeed(${seed});
    }

    function draw() {
      background('${params.bgColor}');

      ambientLight(60);
      pointLight(
        red(color('${params.lightColor}')),
        green(color('${params.lightColor}')),
        blue(color('${params.lightColor}')),
        200, -200, 300
      );
      directionalLight(
        red(color('${params.lightColor}')) * 0.5,
        green(color('${params.lightColor}')) * 0.5,
        blue(color('${params.lightColor}')) * 0.5,
        -1, 1, -1
      );

      rotateX(angle * 0.7);
      rotateY(angle);
      rotateZ(angle * 0.3);

      if (${params.wireframe}) {
        stroke('${params.shapeColor}');
        strokeWeight(1);
        noFill();
      } else {
        noStroke();
        ambientMaterial(red(color('${params.shapeColor}')), green(color('${params.shapeColor}')), blue(color('${params.shapeColor}')));
        specularMaterial(200);
        shininess(50);
      }

      let s = ${params.size};
      let shape = '${params.shape}';
      if (shape === 'torus') torus(s * 0.6, s * 0.2, 64, 32);
      else if (shape === 'sphere') sphere(s, 64, 32);
      else if (shape === 'box') box(s, s, s);
      else if (shape === 'cone') cone(s * 0.6, s * 1.2, 64);
      else if (shape === 'cylinder') cylinder(s * 0.5, s * 1.2, 64);
      else if (shape === 'torusknot') {
        // approximate torusknot with layered tori
        for (let i = 0; i < 3; i++) {
          push();
          rotateY(TWO_PI * i / 3);
          torus(s * 0.5, s * 0.12, 48, 16);
          pop();
        }
      }

      angle += 0.01 * ${params.rotSpeed};
    }

    function windowResized() { resizeCanvas(windowWidth, windowHeight); }
  `,
};
