import { Template } from '../types';

// Static, bounded compositions: rebuild only on a control edit or resize, never
// accumulate textures/graphics per frame. Brush 1.1.4 requires WEBGL + p5 >=1.11.
function painterly(id: string, name: string, description: string, style: string): Template {
  return {
    id, name, description, category: 'color', libraries: ['brush', 'grain'], supportsLiveParams: true,
    params: [
      { id: 'density', name: 'Mark Density', type: 'number', default: 18, min: 6, max: 32, step: 1, category: 'geometry' },
      { id: 'weight', name: 'Brush Weight', type: 'number', default: 1.2, min: 0.4, max: 2.5, step: 0.1, category: 'geometry' },
      { id: 'texture', name: 'Paper Grain', type: 'number', default: 8, min: 0, max: 22, step: 1, category: 'noise' },
      { id: 'ink', name: 'Pigment', type: 'color', default: style === 'garden' ? '#b65366' : style === 'landscape' ? '#353c43' : '#193f55', category: 'color' },
      { id: 'paper', name: 'Paper', type: 'color', default: '#f4eddd', category: 'color' },
    ],
    generateCode: (values, seed) => `
var params = ${JSON.stringify(values)};
var dirty = true;
window.addEventListener('message', function(event) {
  if (event.source !== window.parent || event.data?.type !== 'params-update' || !event.data.params) return;
  Object.keys(params).forEach(function(key) {
    if (Object.prototype.hasOwnProperty.call(event.data.params, key)) params[key] = event.data.params[key];
  });
  dirty = true;
  loop();
});
function setup() {
  pixelDensity(1);
  setAttributes('preserveDrawingBuffer', true);
  createCanvas(windowWidth, windowHeight, WEBGL);
  frameRate(15);
  p5grain.setup({random: function() { return random(); }});
}
function draw() {
  if (!dirty) return;
  dirty = false;
  background(params.paper);
  brush.noField(); brush.noHatch(); brush.noFill();
  // Initialize lazy brush state first: its field setup consumes brush RNG.
  randomSeed(${JSON.stringify(seed)}); noiseSeed(${JSON.stringify(seed)}); brush.seed(${JSON.stringify(seed)});
  var n = constrain(Math.round(Number(params.density) || 18), 6, 32);
  var weight = constrain(Number(params.weight) || 1.2, 0.4, 2.5);
  var w = width, h = height, unit = min(w,h);
  ${style === 'garden' ? `
  for (var i=0;i<n;i++) {
    var x=random(-w*.38,w*.38), y=random(-h*.28,h*.2), r=random(.025,.055)*unit;
    brush.noFill(); brush.set('HB', '#57735b', weight);
    brush.line(x,y,x+random(-20,20),h*.4);
    brush.noStroke(); brush.fill(params.ink, random(45,90)); brush.bleed(.13);
    brush.fillTexture(.55,.6);
    for(var j=0;j<4;j++) brush.circle(x+cos(j*HALF_PI)*r*.6,y+sin(j*HALF_PI)*r*.6,r*.65,true);
    brush.noFill(); brush.set('2B','#7c6340',weight); brush.circle(x,y,r*.17,true);
  }
  ` : style === 'landscape' ? `
  brush.noStroke(); brush.fill('#c6b798',50); brush.bleed(.12);
  brush.circle(w*.22,-h*.23,unit*.085,true); brush.noFill();
  for(var layer=0;layer<4;layer++) {
    brush.set('charcoal',params.ink,weight*(.45+layer*.25));
    for(var i=0;i<n;i++) {
      var x=map(i,0,n-1,-w*.43,w*.43);
      var y=h*(-.05+layer*.13)-noise(i*.14,layer)*h*.22;
      brush.line(x,y,x+w/n*1.3,y+random(-h*.025,h*.025));
      brush.line(x,y,x+random(-unit*.025,unit*.025),y+unit*random(.025,.1));
    }
  }
  ` : `
  for(var i=0;i<n;i++) {
    var x=random(-w*.4,w*.4), y=random(-h*.35,h*.35);
    brush.set(i%4===0?'marker':'rotring',params.ink,weight*random(.6,1.6));
    var points=[];
    for(var j=0;j<16;j++) {
      points.push([x,y]);
      var angle=noise(x/unit*1.7+4,y/unit*1.7+4)*TAU*2;
      x=constrain(x+cos(angle)*unit*.022,-w*.44,w*.44);
      y=constrain(y+sin(angle)*unit*.022,-h*.43,h*.43);
    }
    brush.spline(points,.7);
  }
  `}
  // Flush deferred brush pigment before pixel grain, otherwise post hooks would
  // paint on top of the texture. Pixels belong to the exportable canvas itself.
  brush.reBlend(); brush.reDraw();
  randomSeed(${JSON.stringify(seed)} + 137);
  var grain = constrain(Number(params.texture) || 0,0,22);
  if(grain) p5grain.applyMonochromaticGrain(grain,false);
  noLoop();
}
function windowResized() {
  resizeCanvas(windowWidth,windowHeight);
  // Releases the previous three internal masks before rebuilding at the new size.
  brush.load(); dirty=true; loop();
}
`,
  };
}

export const watercolorGardenTemplate = painterly('watercolor-garden', 'Watercolor Garden', 'Translucent pigment blossoms and fine pencil stems on warm paper.', 'garden');
export const charcoalLandscapeTemplate = painterly('charcoal-landscape', 'Charcoal Landscape', 'Broken charcoal ridgelines, soft sun and layered terrain.', 'landscape');
export const inkFlowTemplate = painterly('ink-flow', 'Ink Flow', 'Seeded, flowing ink ribbons with fine nib and pooled marker accents.', 'flow');
