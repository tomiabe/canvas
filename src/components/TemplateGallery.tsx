import React, { useMemo, useState } from 'react';
import { ChevronDown, Search, Shuffle, X } from 'lucide-react';
import { templates, templateCategories } from '../templates';
import { SketchConfig, Template } from '../types';

interface TemplateGalleryProps {
  config: SketchConfig;
  onChange: (config: SketchConfig) => void;
  mobile?: boolean;
  onClose?: () => void;
}

const templateList = Object.values(templates)
  .filter(template => template.id !== 'custom-sketch')
  .sort((a, b) => a.name.localeCompare(b.name));

export function TemplateGallery({ config, onChange, mobile = false, onClose }: TemplateGalleryProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const currentTemplate = templates[config.templateId];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return templateList.filter(template =>
      (category === 'all' || template.category === category) &&
      (!query || `${template.name} ${template.description}`.toLowerCase().includes(query))
    );
  }, [search, category]);

  const select = (template: Template, randomize = false) => {
    if (!randomize && template.id === config.templateId) {
      onClose?.();
      return;
    }
    const params = Object.fromEntries(template.params.map(param => {
      if (!randomize) return [param.id, param.default];
      if (param.type === 'number') {
        const min = param.min ?? 0;
        const max = param.max ?? 100;
        const step = param.step ?? 1;
        const steps = Math.floor((max - min) / step);
        return [param.id, Number((min + Math.floor(Math.random() * (steps + 1)) * step).toFixed(5))];
      }
      if (param.type === 'boolean') return [param.id, Math.random() > 0.5];
      if (param.type === 'enum' && param.options?.length) {
        return [param.id, param.options[Math.floor(Math.random() * param.options.length)]];
      }
      return [param.id, param.default];
    }));
    onChange({ templateId: template.id, seed: Math.floor(Math.random() * 1000000), params, libraries: template.libraries });
    onClose?.();
  };

  return (
    <aside aria-label="Templates" className={`${mobile ? 'w-full h-full bg-canvas-overlay' : 'w-68 h-full bg-canvas-surface border-r border-canvas-line'} shrink-0 flex flex-col overflow-hidden text-canvas-text/90`}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-[13px] font-medium">Templates</h2>
        <span className="text-xs text-canvas-text/55">{templateList.length}</span>
        {mobile && <button type="button" onClick={onClose} aria-label="Close templates" className="flex size-10 items-center justify-center rounded-lg hover:bg-canvas-white/10"><X size={19} /></button>}
      </div>
      <div className="space-y-2 border-b border-canvas-line px-3 pb-3">
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-canvas-text/55" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search templates" aria-label="Search templates"
            className="min-h-10 w-full rounded-lg border border-canvas-line bg-canvas-bg pl-10 pr-3 text-[13px] text-canvas-text outline-none placeholder:text-canvas-text/45 focus:border-canvas-white/40" />
        </label>
        <label className="relative block">
          <select value={category} onChange={event => setCategory(event.target.value)} aria-label="Template category"
            className="min-h-10 w-full appearance-none rounded-lg border border-canvas-line bg-canvas-raised pl-3 pr-10 text-[13px] text-canvas-text outline-none focus:border-canvas-white/40">
            {templateCategories.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-canvas-text/70" />
        </label>
      </div>
      {!mobile && currentTemplate && <div className="border-b border-canvas-line px-3 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-canvas-text/45">Current</p>
        <div className="rounded-lg bg-canvas-raised px-3 py-2.5">
          <div className="flex items-center gap-2 text-[13px] font-medium"><span className="flex size-4 items-center justify-center rounded-full bg-canvas-white text-[10px] text-canvas-bg">✓</span>{config.generated?.title ?? currentTemplate.name}</div>
          <p className="mt-1 pl-6 text-xs leading-4 text-canvas-text/55">{config.generated ? 'Artwork created with Canvas' : currentTemplate.description}</p>
        </div>
      </div>}
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 && <p className="p-5 text-sm text-canvas-text/60">No templates match your search.</p>}
        {!mobile && <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-canvas-text/45">Browse</p>}
        {filtered.filter(template => mobile || template.id !== config.templateId).map(template => (
          <button key={template.id} type="button" onClick={() => select(template)}
            aria-current={template.id === config.templateId ? 'true' : undefined}
            className={`w-full border-b border-canvas-white/5 px-4 py-2.5 text-left transition-colors hover:bg-canvas-white/10 ${template.id === config.templateId ? 'bg-canvas-white/10 text-canvas-text' : 'text-canvas-text/80'}`}>
            <span className="block text-[13px] font-medium">{template.name}</span>
            <span className="mt-1 block text-xs leading-4 text-canvas-text/55">{template.description}</span>
          </button>
        ))}
      </div>
      <div className="border-t border-canvas-line p-3">
        <button type="button" onClick={() => select(templateList[Math.floor(Math.random() * templateList.length)], true)}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-canvas-white/15 bg-canvas-white/5 text-sm font-medium hover:bg-canvas-white/10">
          <Shuffle size={16} /> Surprise me
        </button>
      </div>
    </aside>
  );
}
