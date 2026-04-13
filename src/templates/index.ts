import { Template } from '../types';
import { particleSystemTemplate } from './particleSystem';
import { noiseFieldTemplate } from './noiseField';
import { gridPatternTemplate } from './gridPattern';
import { brushPlaygroundTemplate } from './brushPlayground';
import { radialMandalaTemplate } from './radialMandala';
import { typographyWarpTemplate } from './typographyWarp';

export const templates: Record<string, Template> = {
  [particleSystemTemplate.id]: particleSystemTemplate,
  [noiseFieldTemplate.id]: noiseFieldTemplate,
  [gridPatternTemplate.id]: gridPatternTemplate,
  [brushPlaygroundTemplate.id]: brushPlaygroundTemplate,
  [radialMandalaTemplate.id]: radialMandalaTemplate,
  [typographyWarpTemplate.id]: typographyWarpTemplate,
};

export const defaultTemplateId = particleSystemTemplate.id;

