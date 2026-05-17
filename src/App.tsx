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
  const [config, setConfig] = useState<SketchConfig>({
    templateId: '',
    seed: 0,
    params: {},
  });

  const [isStarted, setIsStarted] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [exportTrigger, setExportTrigger] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleConfigChange = (newConfig: SketchConfig) => {
    setConfig(newConfig);
    setIsStarted(true);
  };

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const newConfig = await generateConfigFromPrompt(prompt, config);
      setConfig(newConfig);
      setIsStarted(true);
    } catch (error) {
      console.error('AI Generation Error:', error);
      alert('Failed to generate sketch. Check your GROQ_API_KEY and console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#000000] text-white overflow-hidden font-sans relative">
      <TopBar
        config={config}
        onChange={handleConfigChange}
        onExport={() => setExportTrigger(prev => prev + 1)}
        onToggleCode={() => setShowCode(!showCode)}
        showCode={showCode}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {isStarted && <ControlPanel config={config} onChange={handleConfigChange} />}

        <div className="flex-1 relative">
          <CanvasRunner config={config} exportTrigger={exportTrigger} isStarted={isStarted} />
          <PromptBar onGenerate={handleGenerate} isLoading={isGenerating} />
        </div>

        {showCode && <CodeViewer config={config} />}
      </div>
    </div>
  );
}
