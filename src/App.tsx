/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TopBar } from './components/TopBar';
import { ControlPanel } from './components/ControlPanel';
import { CanvasRunner } from './components/CanvasRunner';
import { CodeViewer } from './components/CodeViewer';
import { PromptBar } from './components/PromptBar';
import { SketchConfig } from './types';
import { defaultTemplateId, templates } from './templates';
import { generateConfigFromPrompt } from './lib/ai';

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
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = () => {
    setExportTrigger(prev => prev + 1);
  };

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const newConfig = await generateConfigFromPrompt(prompt, config);
      setConfig(newConfig);
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Failed to generate sketch from prompt. Please check your console.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#000000] text-white overflow-hidden font-sans relative">
      <TopBar 
        config={config} 
        onChange={setConfig} 
        onExport={handleExport}
        onToggleCode={() => setShowCode(!showCode)}
        showCode={showCode}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <ControlPanel config={config} onChange={setConfig} />
        
        <div className="flex-1 relative">
          <CanvasRunner config={config} exportTrigger={exportTrigger} />
          <PromptBar onGenerate={handleGenerate} isLoading={isGenerating} />
        </div>
        
        {showCode && (
          <CodeViewer config={config} />
        )}
      </div>
    </div>
  );
}

