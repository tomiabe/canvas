import { Template } from '../types';
import { particleSystemTemplate } from './particleSystem';
import { noiseFieldTemplate } from './noiseField';
import { gridPatternTemplate } from './gridPattern';
import { brushPlaygroundTemplate } from './brushPlayground';
import { radialMandalaTemplate } from './radialMandala';
import { typographyWarpTemplate } from './typographyWarp';
import { customSketchTemplate } from './customSketch';
import { webglGeometryTemplate } from './webglGeometry';
import { fractalTreeTemplate } from './fractalTree';
import { mathArtTemplate } from './mathArt';
import { bouncingBallsTemplate } from './bouncingBalls';
import { flockingTemplate } from './flocking';
import { gameOfLifeTemplate } from './gameOfLife';
import { metaballsTemplate } from './metaballs';
import { terrainTemplate } from './terrain';
import { spirographTemplate } from './spirograph';
import { fireworksTemplate } from './fireworks';
import { kaleidoscopeTemplate } from './kaleidoscope';
import { colorWavesTemplate } from './colorWaves';
import { rainTemplate } from './rain';
import { neonLinesTemplate } from './neonLines';
import { truchetTilesTemplate } from './truchetTiles';
import { waveInterferenceTemplate } from './waveInterference';
import { reactionDiffusionTemplate } from './reactionDiffusion';
import { solarSystemTemplate } from './solarSystem';
import { audioVisualizerTemplate } from './audioVisualizer';
import { aquariumTemplate } from './aquarium';
import { interactivePlaygroundTemplate } from './interactivePlayground';
import { videoFeedbackTemplate } from './videoFeedback';
import { phyllotaxisTemplate } from './phyllotaxis';
import { circlePackingTemplate } from './circlePacking';
import { mazeGeneratorTemplate } from './mazeGenerator';
import { doublePendulumTemplate } from './doublePendulum';
import { fluidRippleTemplate } from './fluidRipple';
import { lSystemTemplate } from './lSystem';
import { dlaTemplate } from './dla';
import { sortingVisualizerTemplate } from './sortingVisualizer';
import { isometricCubesTemplate } from './isometricCubes';
import { worleyNoiseTemplate } from './worleyNoise';
import { ditheringTemplate } from './dithering';
import { maurerRoseTemplate } from './maurerRose';
import { gradientMeshTemplate } from './gradientMesh';
import { dripEffectTemplate } from './dripEffect';
import { swirlTemplate } from './swirl';
import { halftoneTemplate } from './halftone';
import { pixelSortTemplate } from './pixelSort';
import { asciiRenderTemplate } from './asciiRender';
import { chainReactionTemplate } from './chainReaction';
import { voronoiTemplate } from './voronoi';
import { lorenzAttractorTemplate } from './lorenzAttractor';
import { springSystemTemplate } from './springSystem';

export const templates: Record<string, Template> = {
  [particleSystemTemplate.id]: particleSystemTemplate,
  [noiseFieldTemplate.id]: noiseFieldTemplate,
  [gridPatternTemplate.id]: gridPatternTemplate,
  [brushPlaygroundTemplate.id]: brushPlaygroundTemplate,
  [radialMandalaTemplate.id]: radialMandalaTemplate,
  [typographyWarpTemplate.id]: typographyWarpTemplate,
  [webglGeometryTemplate.id]: webglGeometryTemplate,
  [fractalTreeTemplate.id]: fractalTreeTemplate,
  [mathArtTemplate.id]: mathArtTemplate,
  [bouncingBallsTemplate.id]: bouncingBallsTemplate,
  [flockingTemplate.id]: flockingTemplate,
  [gameOfLifeTemplate.id]: gameOfLifeTemplate,
  [metaballsTemplate.id]: metaballsTemplate,
  [terrainTemplate.id]: terrainTemplate,
  [spirographTemplate.id]: spirographTemplate,
  [fireworksTemplate.id]: fireworksTemplate,
  [kaleidoscopeTemplate.id]: kaleidoscopeTemplate,
  [colorWavesTemplate.id]: colorWavesTemplate,
  [rainTemplate.id]: rainTemplate,
  [neonLinesTemplate.id]: neonLinesTemplate,
  [truchetTilesTemplate.id]: truchetTilesTemplate,
  [waveInterferenceTemplate.id]: waveInterferenceTemplate,
  [reactionDiffusionTemplate.id]: reactionDiffusionTemplate,
  [solarSystemTemplate.id]: solarSystemTemplate,
  [audioVisualizerTemplate.id]: audioVisualizerTemplate,
  [aquariumTemplate.id]: aquariumTemplate,
  [interactivePlaygroundTemplate.id]: interactivePlaygroundTemplate,
  [videoFeedbackTemplate.id]: videoFeedbackTemplate,
  [customSketchTemplate.id]: customSketchTemplate,
  [phyllotaxisTemplate.id]: phyllotaxisTemplate,
  [circlePackingTemplate.id]: circlePackingTemplate,
  [mazeGeneratorTemplate.id]: mazeGeneratorTemplate,
  [doublePendulumTemplate.id]: doublePendulumTemplate,
  [fluidRippleTemplate.id]: fluidRippleTemplate,
  [lSystemTemplate.id]: lSystemTemplate,
  [dlaTemplate.id]: dlaTemplate,
  [sortingVisualizerTemplate.id]: sortingVisualizerTemplate,
  [isometricCubesTemplate.id]: isometricCubesTemplate,
  [worleyNoiseTemplate.id]: worleyNoiseTemplate,
  [ditheringTemplate.id]: ditheringTemplate,
  [maurerRoseTemplate.id]: maurerRoseTemplate,
  [gradientMeshTemplate.id]: gradientMeshTemplate,
  [dripEffectTemplate.id]: dripEffectTemplate,
  [swirlTemplate.id]: swirlTemplate,
  [halftoneTemplate.id]: halftoneTemplate,
  [pixelSortTemplate.id]: pixelSortTemplate,
  [asciiRenderTemplate.id]: asciiRenderTemplate,
  [chainReactionTemplate.id]: chainReactionTemplate,
  [voronoiTemplate.id]: voronoiTemplate,
  [lorenzAttractorTemplate.id]: lorenzAttractorTemplate,
  [springSystemTemplate.id]: springSystemTemplate,
};

export const defaultTemplateId = particleSystemTemplate.id;

export const templateCategories: { key: string; label: string }[] = [
  { key: 'all', label: 'All Templates' },
  { key: 'particles', label: 'Particles & FX' },
  { key: 'physics', label: 'Physics' },
  { key: 'simulation', label: 'Simulation' },
  { key: 'geometry', label: 'Math & Geometry' },
  { key: 'noise', label: 'Noise & Fields' },
  { key: 'color', label: 'Color & Light' },
  { key: 'interaction', label: 'Interactive' },
  { key: 'audio', label: 'Audio' },
  { key: 'image', label: 'Video & Image' },
  { key: '3d', label: '3D & WebGL' },
  { key: 'typography', label: 'Typography' },
];
