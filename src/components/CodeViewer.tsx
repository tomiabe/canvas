import React from 'react';
import { SketchConfig } from '../types';
import { templates } from '../templates';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  config: SketchConfig;
}

export function CodeViewer({ config }: CodeViewerProps) {
  const [copied, setCopied] = React.useState(false);
  const template = templates[config.templateId];
  
  if (!template) return null;

  const code = template.generateCode(config.params, config.seed);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-1/3 min-w-[300px] max-w-[500px] bg-neutral-950 border-l border-neutral-800 h-full flex flex-col text-neutral-200">
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          p5.js Code
        </h3>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <pre className="text-xs font-mono text-neutral-300 whitespace-pre-wrap">
          {code.trim()}
        </pre>
      </div>
    </div>
  );
}
