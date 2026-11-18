import { getSketchScripts } from '../engine/generator';
import { templates } from '../templates';
import { SketchConfig } from '../types';

export function downloadSketchSource(config: SketchConfig): void {
  const template = templates[config.templateId];
  if (!template) return;
  const code = `// Load these scripts in order before running this sketch:\n${getSketchScripts(config).map(url => `// ${url}`).join('\n')}\n\n${template.generateCode(config.params, config.seed)}`;
  const blob = new Blob([code], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `canvas-${config.templateId}-${config.seed}.js`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
