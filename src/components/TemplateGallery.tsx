import React, { useMemo, useRef, useState } from 'react';
import { templates, templateCategories } from '../templates';
import { SketchConfig, Template } from '../types';
import { importImageAsset } from '../lib/imageAssets';
import { Search, ChevronDown, ChevronRight, List, LayoutGrid, ChevronUp, Wand2, ImagePlus } from 'lucide-react';

interface TemplateGalleryProps {
  config: SketchConfig;
  onChange: (config: SketchConfig) => void;
}

type GalleryView = 'dropdown' | 'accordion';

export function TemplateGallery({ config, onChange }: TemplateGalleryProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView] = useState<GalleryView>('accordion');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const imageInput = useRef<HTMLInputElement>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState('');
  const ordinaryTemplates = useMemo(() => Object.values(templates).filter(t => t.id !== 'custom-sketch' && t.id !== 'photo-poster'), []);

  const handleImage = async (file?: File) => {
    if (!file) return;
    setImageBusy(true);
    setImageError('');
    try {
      const imageAssetId = await importImageAsset(file);
      const poster = templates['photo-poster'];
      const params = config.templateId === poster.id
        ? config.params
        : Object.fromEntries(poster.params.map(param => [param.id, param.default]));
      onChange({ templateId: poster.id, seed: Math.floor(Math.random() * 1000000), imageAssetId, params });
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Could not open this image.');
    } finally {
      setImageBusy(false);
      if (imageInput.current) imageInput.current.value = '';
    }
  };

  const filteredTemplates = useMemo(() => {
    let list = [...ordinaryTemplates];
    if (activeCategory !== 'all') {
      list = list.filter(t => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [activeCategory, search, ordinaryTemplates]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, Template[]> = {};
    const allTemplates = [...ordinaryTemplates].sort((a, b) => a.name.localeCompare(b.name));
    for (const t of allTemplates) {
      const cat = t.category || 'misc';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    }
    return groups;
  }, [ordinaryTemplates]);

  const handleSelect = (template: Template) => {
    if (template.id === config.templateId) return;
    const defaultParams: Record<string, any> = {};
    template.params.forEach(p => {
      defaultParams[p.id] = p.default;
    });
    onChange({
      templateId: template.id,
      seed: Math.floor(Math.random() * 1000000),
      params: defaultParams,
      libraries: template.libraries,
    });
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSurpriseMe = () => {
    const choices = ordinaryTemplates;
    const template = choices[Math.floor(Math.random() * choices.length)];
    const randomParams: Record<string, any> = {};
    template.params.forEach(p => {
      if (p.type === 'number') {
        const range = (p.max || 100) - (p.min || 0);
        let val = (p.min || 0) + Math.random() * range;
        if (p.step && p.step >= 1) val = Math.floor(val);
        randomParams[p.id] = val;
      } else if (p.type === 'boolean') {
        randomParams[p.id] = Math.random() > 0.5;
      } else if (p.type === 'enum' && p.options) {
        randomParams[p.id] = p.options[Math.floor(Math.random() * p.options.length)];
      } else {
        randomParams[p.id] = p.default;
      }
    });
    onChange({ templateId: template.id, seed: Math.floor(Math.random() * 1000000), params: randomParams, libraries: template.libraries });
  };

  const catLabel = (key: string) => templateCategories.find(c => c.key === key)?.label || key;

  return (
    <div className="w-64 shrink-0 glass-panel h-full flex flex-col overflow-hidden text-white/90 border-r border-white/10 z-20 shadow-[5px_0_25px_rgba(0,0,0,0.3)]">
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider text-white/50"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            <span>Templates</span>
          </button>
          {!collapsed && (
            <button
              onClick={() => setView(view === 'dropdown' ? 'accordion' : 'dropdown')}
              className="p-1 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              title={view === 'accordion' ? 'Switch to list view' : 'Switch to accordion view'}
            >
              {view === 'accordion' ? <List size={14} /> : <LayoutGrid size={14} />}
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="px-3 pt-3">
            <input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
              aria-label="Choose a photo" onChange={event => void handleImage(event.target.files?.[0])} />
            <button onClick={() => imageInput.current?.click()} disabled={imageBusy}
              className="w-full rounded-xl border border-white/20 bg-white/10 p-3 text-left hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-50">
              <span className="flex items-center gap-2 text-xs font-semibold text-white"><ImagePlus size={16} /> {config.templateId === 'photo-poster' ? 'Replace photo' : 'Create from photo'}</span>
              <span className="mt-1 block text-[10px] leading-relaxed text-white/55">{imageBusy ? 'Preparing photo...' : 'JPG, PNG, WebP, or first frame of a GIF'}</span>
            </button>
            {imageError && <p role="alert" className="mt-2 text-[11px] leading-relaxed text-amber-300">{imageError}</p>}
          </div>
          <div className="px-3 pt-3">
            <button
              onClick={handleSurpriseMe}
              title="Start from a random template"
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer active:scale-95"
            >
              <Wand2 size={13} /> Surprise Me
            </button>
          </div>
          <div className="px-3 pt-2 pb-1">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full bg-white/5 border border-white/10 text-white text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-white/30 placeholder-white/40 transition-colors"
              />
            </div>
          </div>

          {view === 'dropdown' && (
            <div className="px-3 py-1.5 border-b border-white/5 shrink-0">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white text-xs rounded-lg block px-2.5 py-1.5 cursor-pointer appearance-none focus:outline-none focus:border-white/30 transition-colors"
              >
                {templateCategories.map(cat => (
                  <option key={cat.key} value={cat.key} className="bg-[#1c1c1e] text-white">{cat.label}</option>
                ))}
              </select>
            </div>
          )}

          {view === 'accordion' && (
            <div className="px-3 py-1.5 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-white/40 font-medium">{ordinaryTemplates.length} templates + photo poster</span>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
            {view === 'dropdown' && (
              <>
                {filteredTemplates.length === 0 && (
                  <div className="text-xs text-white/40 text-center py-8">No templates found</div>
                )}
                {filteredTemplates.map(t => {
                  const isActive = t.id === config.templateId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelect(t)}
                      className={`w-full text-left px-3 py-2.5 transition-colors cursor-pointer border-b border-white/5 last:border-b-0 ${
                        isActive
                          ? 'bg-white/10 border-l-2 border-l-white text-white'
                          : 'hover:bg-white/5 text-white/70'
                      }`}
                    >
                      <div className="text-xs font-medium leading-tight">{t.name}</div>
                      <div className="text-[10px] text-white/40 mt-0.5 line-clamp-1 leading-relaxed">{t.description}</div>
                    </button>
                  );
                })}
              </>
            )}

            {view === 'accordion' && (
              <>
                {(Object.entries(groupedByCategory) as [string, Template[]][]).map(([cat, catTemplates]) => {
                  const isExpanded = expandedCategories[cat] !== false;
                  const hasActive = catTemplates.some(t => t.id === config.templateId);
                  return (
                    <div key={cat} className="border-b border-white/5 last:border-b-0">
                      <button
                        onClick={() => toggleCategory(cat)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${hasActive ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
                      >
                        <span>{catLabel(cat)}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-white/30">{catTemplates.length}</span>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </div>
                      </button>
                      {isExpanded && catTemplates.map(t => {
                        const isActive = t.id === config.templateId;
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleSelect(t)}
                            className={`w-full text-left pl-7 pr-3 py-2 transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-white/10 border-l-2 border-l-white text-white'
                                : 'hover:bg-white/5 text-white/60'
                            }`}
                          >
                            <div className="text-xs leading-tight">{t.name}</div>
                            <div className="text-[10px] text-white/35 mt-0.5 line-clamp-1">{t.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
