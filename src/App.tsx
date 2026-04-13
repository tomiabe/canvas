/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { ControlPanel } from './components/ControlPanel';
import { CanvasRunner } from './components/CanvasRunner';
import { CodeViewer } from './components/CodeViewer';
import { SketchConfig } from './types';
import { defaultTemplateId, templates } from './templates';

export default function App() {
  const [config, setConfig] = useState<SketchConfig>(() => {
    const template = templates[defaultTemplateId];
    const defaultParams: Record<string, any> = {};
    template.params.forEach(p => {
      defaultParams[p.id] = p.default;
    });
    
    return {
      templateId: defaultTemplateId,
      seed: Math.floor(Math.random() * 1000000),
      params: defaultParams
    };
  });

  const [showCode, setShowCode] = useState(false);
  const [exportTrigger, setExportTrigger] = useState(0);

  const handleExport = () => {
    setExportTrigger(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-neutral-950 text-neutral-200 overflow-hidden font-sans">
      <TopBar 
        config={config} 
        onChange={setConfig} 
        onExport={handleExport}
        onToggleCode={() => setShowCode(!showCode)}
        showCode={showCode}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <ControlPanel config={config} onChange={setConfig} />
        
        <div className="flex-1 relative">
          <CanvasRunner config={config} exportTrigger={exportTrigger} />
        </div>
        
        {showCode && (
          <CodeViewer config={config} />
        )}
      </div>
    </div>
  );
}

