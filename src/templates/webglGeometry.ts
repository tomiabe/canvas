import { Template } from '../types';

export const webglGeometryTemplate: Template = {
  id: 'webgl-geometry',
  name: '3D Geometry (WEBGL)',
  description: 'Explore 3D space, lighting, and materials.',
  category: '3d',
  params: [
    { id: 'shape', name: 'Shape', type: 'enum', options: ['torus', 'box', 'sphere', 'cone', 'cylinder'], default: 'torus', category: '3d', description: '3D primitive shape' },
    { id: 'speed', name: 'Rotation Speed', type: 'number', default: 0.01, min: 0, max: 0.1, step: 0.001, category: 'animation', description: 'How fast the shape rotates' },
    { id: 'lightColor', name: 'Point Light', type: 'color', default: '#ff0055', category: '3d', description: 'Color of the main point light' },
    { id: 'ambientColor', name: 'Ambient Light', type: 'color', default: '#222222', category: '3d', description: 'Color of ambient (fill) light' },
    { id: 'materialColor', name: 'Material Color', type: 'color', default: '#ffffff', category: '3d', description: 'Color of the shape material' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#000000', category: 'color' }
  ],
  generateCode: (params, seed) => `
    function setup() {
      createCanvas(windowWidth, windowHeight, WEBGL);
      noStroke();
    }
    
    function draw() {
      background('${params.bgColor}');
      
      ambientLight(color('${params.ambientColor}'));
      
      let locX = mouseX - width / 2;
      let locY = mouseY - height / 2;
      pointLight(color('${params.lightColor}'), locX, locY, 250);
      
      specularMaterial(color('${params.materialColor}'));
      shininess(50);
      
      rotateX(frameCount * ${params.speed});
      rotateY(frameCount * ${params.speed} * 0.8);
      
      if ('${params.shape}' === 'torus') torus(min(width,height)*0.2, min(width,height)*0.08);
      else if ('${params.shape}' === 'box') box(min(width,height)*0.3);
      else if ('${params.shape}' === 'sphere') sphere(min(width,height)*0.25);
      else if ('${params.shape}' === 'cone') cone(min(width,height)*0.2, min(width,height)*0.4);
      else if ('${params.shape}' === 'cylinder') cylinder(min(width,height)*0.2, min(width,height)*0.4);
    }
    
    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `
};
