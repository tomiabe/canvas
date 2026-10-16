export type ParamType = 'number' | 'color' | 'boolean' | 'enum' | 'color-array' | 'code' | 'string';

export type ParamCategory =
  | 'particles'
  | 'physics'
  | 'geometry'
  | 'color'
  | 'animation'
  | 'interaction'
  | 'typography'
  | '3d'
  | 'noise'
  | 'audio'
  | 'image'
  | 'simulation'
  | 'layout'
  | 'misc';

export interface ParamDef {
  id: string;
  name: string;
  type: ParamType;
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // for enum
  category?: ParamCategory;
  description?: string;
  suffix?: string;
}

export interface Preset {
  name: string;
  params: Record<string, any>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category?: ParamCategory;
  params: ParamDef[];
  presets?: Preset[];
  supportsLiveParams?: boolean;
  generateCode: (params: Record<string, any>, seed: number) => string;
}

export interface SketchConfig {
  templateId: string;
  seed: number;
  params: Record<string, any>;
  generated?: {
    title: string;
    controls: ParamDef[];
    provider?: string;
  };
}
