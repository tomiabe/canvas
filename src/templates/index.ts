import { Template } from '../types';

// Original templates
import { particleSystemTemplate } from './particleSystem';
import { noiseFieldTemplate } from './noiseField';
import { gridPatternTemplate } from './gridPattern';
import { brushPlaygroundTemplate } from './brushPlayground';
import { radialMandalaTemplate } from './radialMandala';
import { typographyWarpTemplate } from './typographyWarp';

// New templates
import { webglGeometryTemplate } from './webglGeometry';
import { fractalTreeTemplate } from './fractalTree';
import { mathArtTemplate } from './mathArt';
import { spirographTemplate } from './spirograph';
import { kaleidoscopeTemplate } from './kaleidoscope';
import { auroraTemplate } from './aurora';
import { starfieldTemplate } from './starfield';
import { fireEffectTemplate } from './fireEffect';
import { voronoiTemplate } from './voronoi';
import { gameOfLifeTemplate } from './gameOfLife';
import { waveInterferenceTemplate } from './waveInterference';
import { stringArtTemplate } from './stringArt';
import { truchetTilesTemplate } from './truchetTiles';
import { roseCurvesTemplate } from './roseCurves';
import { mandelbrotTemplate } from './mandelbrot';
import { orbitsTemplate } from './orbits';
import { lightningTemplate } from './lightning';
import { terrain3DTemplate } from './terrain3D';
import { bubblesTemplate } from './bubbles';
import { rainDropsTemplate } from './rainDrops';
import { ribbonsTemplate } from './ribbons';
import { bouncingBallsTemplate } from './bouncingBalls';
import { dotMatrixTemplate } from './dotMatrix';
import { clockArtTemplate } from './clockArt';
import { geometricFlowTemplate } from './geometricFlow';
import { inkBlotTemplate } from './inkBlot';
import { lSystemTemplate } from './lSystem';
import { crystallineTemplate } from './crystalline';
import { moirePatternTemplate } from './moirePattern';
import { sandPileTemplate } from './sandPile';
import { fourierEpicyclesTemplate } from './fourierEpicycles';
import { neonPulseTemplate } from './neonPulse';
import { constellationsTemplate } from './constellations';
import { perlinMountainsTemplate } from './perlinMountains';
import { attractorsTemplate } from './attractors';
import { painterlyTemplate } from './painterly';
import { shatterGlassTemplate } from './shatterGlass';

export const templates: Record<string, Template> = {
  // Originals
  [particleSystemTemplate.id]: particleSystemTemplate,
  [noiseFieldTemplate.id]: noiseFieldTemplate,
  [gridPatternTemplate.id]: gridPatternTemplate,
  [brushPlaygroundTemplate.id]: brushPlaygroundTemplate,
  [radialMandalaTemplate.id]: radialMandalaTemplate,
  [typographyWarpTemplate.id]: typographyWarpTemplate,

  // New
  [webglGeometryTemplate.id]: webglGeometryTemplate,
  [fractalTreeTemplate.id]: fractalTreeTemplate,
  [mathArtTemplate.id]: mathArtTemplate,
  [spirographTemplate.id]: spirographTemplate,
  [kaleidoscopeTemplate.id]: kaleidoscopeTemplate,
  [auroraTemplate.id]: auroraTemplate,
  [starfieldTemplate.id]: starfieldTemplate,
  [fireEffectTemplate.id]: fireEffectTemplate,
  [voronoiTemplate.id]: voronoiTemplate,
  [gameOfLifeTemplate.id]: gameOfLifeTemplate,
  [waveInterferenceTemplate.id]: waveInterferenceTemplate,
  [stringArtTemplate.id]: stringArtTemplate,
  [truchetTilesTemplate.id]: truchetTilesTemplate,
  [roseCurvesTemplate.id]: roseCurvesTemplate,
  [mandelbrotTemplate.id]: mandelbrotTemplate,
  [orbitsTemplate.id]: orbitsTemplate,
  [lightningTemplate.id]: lightningTemplate,
  [terrain3DTemplate.id]: terrain3DTemplate,
  [bubblesTemplate.id]: bubblesTemplate,
  [rainDropsTemplate.id]: rainDropsTemplate,
  [ribbonsTemplate.id]: ribbonsTemplate,
  [bouncingBallsTemplate.id]: bouncingBallsTemplate,
  [dotMatrixTemplate.id]: dotMatrixTemplate,
  [clockArtTemplate.id]: clockArtTemplate,
  [geometricFlowTemplate.id]: geometricFlowTemplate,
  [inkBlotTemplate.id]: inkBlotTemplate,
  [lSystemTemplate.id]: lSystemTemplate,
  [crystallineTemplate.id]: crystallineTemplate,
  [moirePatternTemplate.id]: moirePatternTemplate,
  [sandPileTemplate.id]: sandPileTemplate,
  [fourierEpicyclesTemplate.id]: fourierEpicyclesTemplate,
  [neonPulseTemplate.id]: neonPulseTemplate,
  [constellationsTemplate.id]: constellationsTemplate,
  [perlinMountainsTemplate.id]: perlinMountainsTemplate,
  [attractorsTemplate.id]: attractorsTemplate,
  [painterlyTemplate.id]: painterlyTemplate,
  [shatterGlassTemplate.id]: shatterGlassTemplate,
};

export const defaultTemplateId = particleSystemTemplate.id;
