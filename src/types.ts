export type ParamType = 'number' | 'color' | 'boolean' | 'enum' | 'color-array';

export interface ParamDef {
  id: string;
  name: string;
  type: ParamType;
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // for enum
}

export interface Preset {
  name: string;
  params: Record<string, any>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  params: ParamDef[];
  presets?: Preset[];
  supportsLiveParams?: boolean;
  generateCode: (params: Record<string, any>, seed: number) => string;
}

export interface SketchConfig {
  templateId: string;
  seed: number;
  params: Record<string, any>;
  customCode?: string;
}
