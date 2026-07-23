import React, { useState } from 'react';
import { Cpu, Layers, Sparkles, CheckCircle, Info, Grid } from 'lucide-react';
import { FrameAnalysisResult, SampleScene } from '../types';

interface ExplainabilityModalProps {
  analysisResult: FrameAnalysisResult | null;
  selectedScene: SampleScene;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({
  analysisResult,
  selectedScene,
}) => {
  const [viewMode, setViewMode] = useState<'heatmap' | 'sidebyside' | 'features'>('heatmap');
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.75);

  if (!analysisResult) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 text-center text-zinc-400 space-y-3 font-sans backdrop-blur-md">
        <Cpu className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
        <h3 className="text-base font-bold text-white">No Heatmap Data Available</h3>
        <p className="text-xs max-w-md mx-auto text-zinc-500">
          Scan a clutter scene first to extract Grad-CAM layer attention maps and visual saliency weights.
        </p>
      </div>
    );
  }

  const { explainability, candidates, selectedCandidateIndex } = analysisResult;
  const selectedCandidate = candidates[selectedCandidateIndex] || candidates[0];
  const heatmap = explainability?.heatmapMatrix || [];

  return (
    <div className="space-y-5 font-sans">
      {/* Header & Tabs */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Grad-CAM Explainability & Feature Saliency</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Visualizing neural activation layer feature maps to ensure model transparency and eliminate shortcut learning biases.
          </p>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center space-x-1 bg-zinc-950/80 p-1.5 rounded-xl border border-zinc-800 text-xs font-mono">
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              viewMode === 'heatmap' ? 'bg-cyan-400 text-black font-bold shadow-md shadow-cyan-400/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5 inline mr-1" />
            Heatmap
          </button>
          <button
            onClick={() => setViewMode('sidebyside')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              viewMode === 'sidebyside' ? 'bg-cyan-400 text-black font-bold shadow-md shadow-cyan-400/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            Before / After
          </button>
          <button
            onClick={() => setViewMode('features')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              viewMode === 'features' ? 'bg-cyan-400 text-black font-bold shadow-md shadow-cyan-400/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5 inline mr-1" />
            Attribution
          </button>
        </div>
      </div>

      {/* Main Heatmap Matrix Visualizer */}
      {viewMode === 'heatmap' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 relative rounded-2xl overflow-hidden bg-black border border-zinc-800/80 shadow-2xl aspect-[16/9] flex items-center justify-center">
            <img
              src={selectedScene.imageUrl}
              alt="Clutter Scene"
              className="w-full h-full object-cover"
            />

            {/* Grad-CAM Heatmap Grid */}
            <div
              className="absolute inset-0 grid grid-cols-8 grid-rows-8 pointer-events-none transition-opacity duration-300"
              style={{ opacity: heatmapOpacity }}
            >
              {heatmap.map((row, rIdx) =>
                row.map((val, cIdx) => {
                  const hue = (1 - val) * 200;
                  return (
                    <div
                      key={`${rIdx}_${cIdx}`}
                      className="transition-all duration-300 border border-black/10 flex items-center justify-center text-[9px] font-mono text-white/80"
                      style={{
                        backgroundColor: val > 0.15 ? `hsla(${hue}, 100%, 50%, ${val * 0.7})` : 'transparent',
                      }}
                    >
                      {val > 0.3 && `${Math.round(val * 100)}%`}
                    </div>
                  );
                })
              )}
            </div>

            {selectedCandidate && (
              <div
                className="absolute border-2 border-cyan-400 rounded-lg shadow-lg shadow-cyan-500/40 pointer-events-none animate-pulse"
                style={{
                  top: `${selectedCandidate.bbox.ymin / 10}%`,
                  left: `${selectedCandidate.bbox.xmin / 10}%`,
                  width: `${(selectedCandidate.bbox.xmax - selectedCandidate.bbox.xmin) / 10}%`,
                  height: `${(selectedCandidate.bbox.ymax - selectedCandidate.bbox.ymin) / 10}%`,
                }}
              />
            )}

            {/* Opacity Control Bar */}
            <div className="absolute bottom-3 left-3 right-3 bg-zinc-950/90 backdrop-blur-md p-3 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300">Thermal Opacity:</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={heatmapOpacity}
                onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                className="w-48 accent-cyan-400 cursor-pointer"
              />
              <span className="text-cyan-400 font-bold">{Math.round(heatmapOpacity * 100)}%</span>
            </div>
          </div>

          {/* Sidebar Analysis */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-md">
            <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Layer Saliency</span>
            </h3>

            <p className="text-xs text-zinc-300 font-mono bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80 leading-relaxed">
              "{explainability.gradCamSummary}"
            </p>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                Activation Triggers:
              </span>
              {explainability.primaryFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800/80 text-xs font-mono">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-zinc-200">{feat}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-800/80 font-mono">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Region Weight:
              </span>
              {explainability.keyRegions.map((reg, idx) => (
                <div key={idx} className="space-y-1 mb-2">
                  <div className="flex justify-between text-[11px] text-zinc-300">
                    <span>{reg.name}</span>
                    <span className="text-cyan-400">{Math.round(reg.relevance * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${reg.relevance * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Side by Side Mode */}
      {viewMode === 'sidebyside' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 font-bold uppercase">Raw Input Scene</span>
              <span className="text-zinc-500">Unsegmented</span>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black border border-zinc-800 aspect-[16/9]">
              <img src={selectedScene.imageUrl} alt="Raw Input" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold uppercase">SAM 3 Concept Mask</span>
              <span className="text-emerald-400 font-bold">Zero-Shot Segmented</span>
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-black border border-emerald-500/50 aspect-[16/9] shadow-xl">
              <img src={selectedScene.imageUrl} alt="Segmented Output" className="w-full h-full object-cover filter brightness-90" />
              {selectedCandidate && (
                <div
                  className="absolute border-2 border-emerald-400 rounded-xl shadow-2xl shadow-emerald-500/80 bg-emerald-500/20 backdrop-blur-[1px] animate-pulse"
                  style={{
                    top: `${selectedCandidate.bbox.ymin / 10}%`,
                    left: `${selectedCandidate.bbox.xmin / 10}%`,
                    width: `${(selectedCandidate.bbox.xmax - selectedCandidate.bbox.xmin) / 10}%`,
                    height: `${(selectedCandidate.bbox.ymax - selectedCandidate.bbox.ymin) / 10}%`,
                  }}
                >
                  <span className="absolute -top-6 left-0 bg-emerald-500 text-black text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                    {selectedCandidate.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feature Attribution Info Mode */}
      {viewMode === 'features' && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-4 backdrop-blur-md">
          <h3 className="text-sm font-bold text-white font-mono">
            How SAM 3 Concept Segmentation Computes Visual Saliency
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            Meta's SAM 3 utilizes promptable concept embeddings mapped directly onto vision transformer token layers.
            Instead of standard class logits, Warmer evaluates pixel-level affinity matrices between the prompt concept and image tokens.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-mono">
            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 space-y-2">
              <h4 className="text-xs font-bold text-cyan-400">1. Prompt Tokenization</h4>
              <p className="text-[11px] text-zinc-400">
                Natural language query is converted to dense prompt embeddings via text encoder.
              </p>
            </div>
            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 space-y-2">
              <h4 className="text-xs font-bold text-cyan-400">2. Vision Feature Maps</h4>
              <p className="text-[11px] text-zinc-400">
                High-resolution image grid extracted through vision transformer backbone.
              </p>
            </div>
            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 space-y-2">
              <h4 className="text-xs font-bold text-cyan-400">3. Cross-Attention Mask</h4>
              <p className="text-[11px] text-zinc-400">
                Pixel-level affinity computed, generating zero-shot segment masks across video frames.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
