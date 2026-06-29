import { Template } from '../types';

export const radialMandalaTemplate: Template = {
  id: 'radial-mandala',
  name: 'Radial Mandala',
  description: 'Symmetrical radial patterns with layered geometry.',
  category: 'geometry',
  params: [
    { id: 'segments', name: 'Segments', type: 'number', default: 12, min: 3, max: 36, step: 1, category: 'geometry', description: 'Number of radial divisions' },
    { id: 'layers', name: 'Layers', type: 'number', default: 5, min: 1, max: 15, step: 1, category: 'geometry', description: 'Number of concentric layers' },
    { id: 'radius', name: 'Max Radius', type: 'number', default: 300, min: 100, max: 800, step: 10, category: 'geometry', description: 'Outer radius of the mandala' },
    { id: 'palette', name: 'Color Palette', type: 'color-array', default: ['#00a8e8', '#007ea7', '#003459', '#00171f', '#ffffff'], category: 'color' },
    { id: 'bgColor', name: 'Background', type: 'color', default: '#00171f', category: 'color' },
    { id: 'animated', name: 'Animated', type: 'boolean', default: true, category: 'animation', description: 'Layers rotate over time' }
  ],
  presets: [
    {
      name: 'Hypnotic',
      params: { segments: 24, layers: 10, radius: 400, palette: ['#ff0054', '#9e0059', '#390099', '#ffbd00', '#ffffff'], bgColor: '#000000', animated: true }
    },
    {
      name: 'Sacred Geometry',
      params: { segments: 6, layers: 8, radius: 350, palette: ['#d4af37', '#c5a059', '#8a6d3b', '#f3e5ab'], bgColor: '#1a1a1a', animated: false }
    }
  ],
  generateCode: (params, seed) => `
    let palette = ${JSON.stringify(params.palette)};
    let layersData = [];
    
    function setup() {
      createCanvas(windowWidth, windowHeight);
      randomSeed(${seed});
      
      for (let i = 0; i < ${params.layers}; i++) {
        layersData.push({
          radius: map(i, 0, ${params.layers}, ${params.radius} * 0.2, ${params.radius}),
          color: random(palette),
          shapeType: floor(random(3)), // 0: circle, 1: line, 2: triangle
          rotationSpeed: random(-0.02, 0.02),
          size: random(10, 50)
        });
      }
      
      if (!${params.animated}) {
        noLoop();
      }
    }
    
    function draw() {
      background('${params.bgColor}');
      translate(width / 2, height / 2);
      
      let segments = ${params.segments};
      let angleStep = TWO_PI / segments;
      
      for (let i = 0; i < layersData.length; i++) {
        let layer = layersData[i];
        
        push();
        if (${params.animated}) {
          rotate(frameCount * layer.rotationSpeed);
        }
        
        for (let j = 0; j < segments; j++) {
          push();
          rotate(j * angleStep);
          translate(layer.radius, 0);
          
          fill(layer.color);
          noStroke();
          
          if (layer.shapeType === 0) {
            circle(0, 0, layer.size);
          } else if (layer.shapeType === 1) {
            stroke(layer.color);
            strokeWeight(layer.size * 0.1);
            line(-layer.size/2, 0, layer.size/2, 0);
          } else {
            triangle(-layer.size/2, layer.size/2, layer.size/2, layer.size/2, 0, -layer.size/2);
          }
          pop();
        }
        pop();
      }
    }
    
    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      if (!${params.animated}) {
        draw();
      }
    }
  `
};
