import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { VoiceQueryInput } from './components/VoiceQueryInput';
import { CameraView } from './components/CameraView';
import { DisambiguationPanel } from './components/DisambiguationPanel';
import { ExplainabilityModal } from './components/ExplainabilityModal';
import { FailureGallery } from './components/FailureGallery';
import { TechStackDrawer } from './components/TechStackDrawer';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';

import { FrameAnalysisResult, SampleScene, SystemSettings } from './types';
import { SAMPLE_SCENES } from './data/sampleScenes';
import { triggerProjectZipDownload } from './lib/clientZip';
import { audioEngine } from './lib/audioEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<'live' | 'disambiguation' | 'explainability' | 'failures' | 'specs'>('live');
  const [query, setQuery] = useState<string>('find my brass keys, not my roommate silver keychain');
  const [negativeExemplars, setNegativeExemplars] = useState<string>('not my roommate silver keychain');
  const [selectedScene, setSelectedScene] = useState<SampleScene>(SAMPLE_SCENES[0]);
  const [activeSourceMode, setActiveSourceMode] = useState<'preset' | 'webcam' | 'upload'>('preset');

  const [analysisResult, setAnalysisResult] = useState<FrameAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const [settings, setSettings] = useState<SystemSettings>({
    confidenceThreshold: 0.5,
    explainabilityMode: true,
    audioFeedback: true,
    speechGuidance: true,
    highContrastMode: false,
    motionGatedFps: 30,
    showHudMetrics: true,
    modelBackend: 'SAM3_GPU',
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Sync scene default query when switching presets
  useEffect(() => {
    if (activeSourceMode === 'preset') {
      setQuery(selectedScene.defaultQuery);
      if (selectedScene.defaultQuery.includes('not the')) {
        const parts = selectedScene.defaultQuery.split('not the');
        setNegativeExemplars(`not the ${parts[1].trim()}`);
      } else {
        setNegativeExemplars('');
      }
    }
  }, [selectedScene, activeSourceMode]);

  // Main Frame Scan Call to Backend Express API /api/analyze-frame
  const handleAnalyzeFrame = useCallback(
    async (imageBase64: string) => {
      setIsAnalyzing(true);
      try {
        const res = await fetch('/api/analyze-frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            query,
            negativeExemplars,
            confidenceThreshold: settings.confidenceThreshold,
          }),
        });

        if (res.ok) {
          const data: FrameAnalysisResult = await res.json();
          setAnalysisResult(data);

          // Audio speech announcement if enabled
          if (settings.speechGuidance && data.candidates.length > 0) {
            const match = data.candidates[data.selectedCandidateIndex] || data.candidates[0];
            if (match && match.isMatch) {
              audioEngine.playFoundChord();
              audioEngine.speak(`Target found: ${match.label}`);
            }
          }
        }
      } catch (err) {
        console.warn('Frame analysis API call error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [query, negativeExemplars, settings.confidenceThreshold, settings.speechGuidance]
  );

  const handleSelectCandidate = (index: number) => {
    if (analysisResult) {
      setAnalysisResult((prev) =>
        prev
          ? {
              ...prev,
              selectedCandidateIndex: index,
            }
          : null
      );
    }
  };

  const handleDownloadZip = () => {
    triggerProjectZipDownload();
  };

  return (
    <div className={`min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-black ${
      settings.highContrastMode ? 'contrast-125 saturate-150' : ''
    }`}>
      {/* Background Ambient Glow Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onDownloadZip={handleDownloadZip}
        settings={settings}
        setSettings={setSettings}
        candidateCount={analysisResult?.candidates.length || 0}
      />

      {/* Main Content Body */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Voice Query Bar */}
        <VoiceQueryInput
          query={query}
          setQuery={setQuery}
          negativeExemplars={negativeExemplars}
          setNegativeExemplars={setNegativeExemplars}
          onAnalyzeTrigger={() => {
            const img = document.querySelector('img[alt="Clutter View"]') as HTMLImageElement;
            if (img && img.src) {
              handleAnalyzeFrame(img.src);
            }
          }}
          isAnalyzing={isAnalyzing}
        />

        {/* Tab Content Views */}
        {activeTab === 'live' && (
          <CameraView
            analysisResult={analysisResult}
            onAnalyzeFrame={handleAnalyzeFrame}
            isAnalyzing={isAnalyzing}
            settings={settings}
            selectedScene={selectedScene}
            setSelectedScene={setSelectedScene}
            activeSourceMode={activeSourceMode}
            setActiveSourceMode={setActiveSourceMode}
            onSelectCandidate={handleSelectCandidate}
          />
        )}

        {activeTab === 'disambiguation' && (
          <DisambiguationPanel
            analysisResult={analysisResult}
            onSelectCandidate={handleSelectCandidate}
          />
        )}

        {activeTab === 'explainability' && (
          <ExplainabilityModal
            analysisResult={analysisResult}
            selectedScene={selectedScene}
          />
        )}

        {activeTab === 'failures' && <FailureGallery />}

        {activeTab === 'specs' && <TechStackDrawer />}
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onDownloadZip={handleDownloadZip}
      />

      {/* Minimal Footer */}
      <footer className="relative z-10 border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md py-4 text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <span>WARMER // AI COMPUTER VISION ENGINE • SAM 3 + OPENROUTER</span>
          <div className="flex items-center space-x-3">
            <button onClick={handleDownloadZip} className="text-cyan-400 font-semibold hover:underline">
              Download .ZIP Deliverable
            </button>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">GPU Accelerated</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
