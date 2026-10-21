import { Template } from '../types';

export const photoPosterTemplate: Template = {
  id: 'photo-poster',
  name: 'Photo Poster',
  description: 'Turn your own image into an editable graphic poster. Your photo stays in this browser.',
  category: 'image',
  supportsLiveParams: true,
  params: [
    { id: 'effect', name: 'Treatment', type: 'enum', default: 'Echo', options: ['Echo', 'Duotone', 'Mosaic'], category: 'image' },
    { id: 'title', name: 'Title', type: 'string', default: 'MAKE SOME NOISE', category: 'typography' },
    { id: 'caption', name: 'Small text', type: 'string', default: 'A STUDY IN IMAGE AND FORM', category: 'typography' },
    { id: 'accent', name: 'Accent', type: 'color', default: '#ed4b32', category: 'color' },
    { id: 'background', name: 'Paper', type: 'color', default: '#151515', category: 'color' },
    { id: 'repeat', name: 'Image slices', type: 'number', default: 6, min: 2, max: 12, step: 1, category: 'image' },
    { id: 'shift', name: 'Slice shift', type: 'number', default: 46, min: 0, max: 140, step: 1, category: 'image' },
    { id: 'grain', name: 'Grain', type: 'number', default: 35, min: 0, max: 100, step: 1, category: 'image' },
    { id: 'motion', name: 'Animate', type: 'boolean', default: true, category: 'animation' },
  ],
  presets: [
    { name: 'Echo', params: { effect: 'Echo', accent: '#ef4b35', background: '#161616', repeat: 6, shift: 46, grain: 35 } },
    { name: 'Electric', params: { effect: 'Duotone', accent: '#b8ef32', background: '#25237a', grain: 18 } },
    { name: 'Cutouts', params: { effect: 'Mosaic', accent: '#496eff', background: '#161616', grain: 22 } },
  ],
  generateCode: (params, seed) => {
    const safeParams = JSON.stringify(params).replace(/</g, '\\u003c');
    return `
      const W = 720, H = 1080;
      let posterParams = ${safeParams};
      let sourceImage, colorImage, monoImage, hardImage;
      let imageError = '';
      const posterSeed = ${Number.isFinite(seed) ? seed : 0};

      function setup() {
        const surface = createCanvas(W, H);
        function fitPoster() {
          const scale = Math.min(window.innerWidth * 0.9 / W, window.innerHeight * 0.9 / H);
          surface.elt.style.transform = 'scale(' + scale + ')';
          surface.elt.style.flexShrink = '0';
        }
        fitPoster();
        window.addEventListener('resize', fitPoster);
        document.body.style.display = 'flex';
        document.body.style.alignItems = 'center';
        document.body.style.justifyContent = 'center';
        document.body.style.height = '100vh';
        pixelDensity(1);
        frameRate(24);
      }

      window.addEventListener('message', (event) => {
        if (event.source !== parent) return;
        if (event.data?.type === 'params-update') posterParams = event.data.params;
        if (event.data?.type !== 'image-asset') return;
        if (!event.data.dataUrl) {
          imageError = 'Photo unavailable. Please upload it again.';
          return;
        }
        loadImage(event.data.dataUrl, image => {
          sourceImage = image;
          colorImage = makeCrop(image);
          monoImage = makeCrop(image);
          monoImage.filter(GRAY);
          hardImage = makeCrop(image);
          hardImage.filter(GRAY);
          hardImage.filter(THRESHOLD, 0.52);
          imageError = '';
        }, () => { imageError = 'Photo could not be opened.'; });
      });

      function makeCrop(img) {
        const g = createGraphics(604, 760);
        const ratio = max(g.width / img.width, g.height / img.height);
        const sw = g.width / ratio, sh = g.height / ratio;
        g.image(img, 0, 0, g.width, g.height, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh);
        return g;
      }

      function draw() {
        background(posterParams.background || '#151515');
        const accent = posterParams.accent || '#ed4b32';
        const effect = posterParams.effect || 'Echo';
        const moving = posterParams.motion ? sin(frameCount * 0.035) * 8 : 0;
        const x = 58, y = 92, w = 604, h = 760;

        noStroke();
        fill(255, 180);
        textFont('Arial');
        textStyle(BOLD);
        textSize(14);
        textAlign(LEFT, TOP);
        text('CANVAS  /  IMAGE STUDIES', x, 39);
        textAlign(RIGHT, TOP);
        text('NO. 01', W - x, 39);
        textAlign(LEFT, TOP);

        if (!sourceImage) {
          fill(255, 12);
          rect(x, y, w, h);
          fill(255, 150);
          textStyle(NORMAL);
          textSize(22);
          textAlign(CENTER, CENTER);
          text(imageError || 'Preparing your photo...', W / 2, y + h / 2);
          textAlign(LEFT, TOP);
        } else if (effect === 'Duotone') {
          fill(accent);
          rect(x, y, w, h);
          tint(accent);
          image(hardImage, x, y, w, h);
          noTint();
          fill(posterParams.background || '#151515');
          for (let i = 0; i < 12; i++) {
            const yy = y + i * 64;
            rect(x + (i % 3) * 22, yy, w * 0.17, 9);
          }
        } else if (effect === 'Mosaic') {
          image(colorImage, x, y, w, h);
          const cells = max(3, floor(Number(posterParams.repeat) || 6));
          const size = w / cells;
          randomSeed(posterSeed);
          for (let row = 0; row < floor(h / size); row++) {
            for (let col = 0; col < cells; col++) {
              const r = random();
              if (r < 0.28) {
                fill(r < 0.12 ? accent : posterParams.background || '#151515');
                rect(x + col * size, y + row * size, size + 1, size + 1);
              } else if (r < 0.43) {
                image(monoImage, x + col * size, y + row * size, size + 1, size + 1,
                  col * size, row * size, size, size);
              }
            }
          }
        } else {
          fill('#090909');
          rect(x, y, w, h);
          const count = max(2, floor(Number(posterParams.repeat) || 6));
          const band = w / count;
          image(monoImage, x, y, w, h);
          for (let i = 0; i < count; i++) {
            drawingContext.save();
            drawingContext.beginPath();
            drawingContext.rect(x + i * band, y, band + 1, h);
            drawingContext.clip();
            const offset = (i - (count - 1) / 2) * Number(posterParams.shift || 0) + moving * (i % 2 ? 1 : -1);
            image(monoImage, x + offset, y, w, h);
            drawingContext.restore();
          }
          fill(accent);
          for (let i = 0; i < count; i++) {
            const yy = y + 70 + ((i * 131 + posterSeed) % 560);
            rect(x + i * band + 4, yy, min(40, band - 8), 12);
          }
        }

        fill(accent);
        rect(x, 877, 38, 5);
        fill(255);
        textStyle(BOLD);
        textSize(58);
        textLeading(61);
        textAlign(LEFT, TOP);
        const title = String(posterParams.title || 'UNTITLED').slice(0, 50).toUpperCase();
        text(title, x, 900, w, 132);
        fill(255, 155);
        textStyle(NORMAL);
        textSize(13);
        text(String(posterParams.caption || '').slice(0, 80).toUpperCase(), x, 1034, w - 50, 26);
        textAlign(RIGHT, TOP);
        text('01 / 01', W - x, 1034);
        textAlign(LEFT, TOP);

        const grains = floor(Number(posterParams.grain || 0) * 18);
        randomSeed(posterSeed + 101);
        stroke(255, 25);
        strokeWeight(1);
        for (let i = 0; i < grains; i++) point(random(W), random(H));
        noStroke();
      }
    `;
  },
};
