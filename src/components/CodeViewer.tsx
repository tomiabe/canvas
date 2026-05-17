import React from 'react';
import { SketchConfig } from '../types';
import { templates } from '../templates';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  config: SketchConfig;
}

export function CodeViewer({ config }: CodeViewerProps) {
  const [copied, setCopied] = React.useState(false);

  let code: string;
  if (config.customCode) {
    code = config.customCode;
  } else {
    const template = templates[config.templateId];
    if (!template) return null;
    code = template.generateCode(config.params, config.seed);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-1/3 min-w-[300px] max-w-[500px] glass-panel border-l border-white/10 h-full flex flex-col text-white/90 z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.5)]"></span>
          p5.js Code
        </h3>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors flex items-center gap-1.5 text-xs cursor-pointer active:scale-95"
        >
          {copied ? <Check size={14} className="text-[#34C759]" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <pre className="text-xs font-mono text-white/70 whitespace-pre-wrap leading-relaxed">
          {code.trim()}
        </pre>
      </div>
    </div>
  );
}
