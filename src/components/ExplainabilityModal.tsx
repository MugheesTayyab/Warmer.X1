import React, { useState } from 'react';
import { Eye, Cpu, Layers, Sparkles, Sliders, CheckCircle, Info, Grid, Maximize2 } from 'lucide-react';
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-3">
        <Cpu className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
        <h3 className="text-base font-bold text-slate-200">No Heatmap Data Available</h3>
        <p className="text-xs max-w-md mx-auto">
          Scan a clutter scene first to extract Grad-CAM layer attention maps and visual saliency weights.
        </p>
      </div>
    );
  }

  const { explainability, candidates, selectedCandidateIndex } = analysisResult;
  const selectedCandidate = candidates[selectedCandidateIndex] || candidates[0];
  const heatmap = explainability?.heatmapMatrix || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Grad-CAM Explainability & Feature Saliency</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing neural activation layer feature maps to ensure model transparency and eliminate shortcut learning biases.
          </p>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === 'heatmap' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5 inline mr-1" />
            Heatmap Layer
          </button>
          <button
            onClick={() => setViewMode('sidebyside')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === 'sidebyside' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            Before vs After
          </button>
          <button
            onClick={() => setViewMode('features')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === 'features' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5 inline mr-1" />
            Feature Attribution
          </button>
        </div>
      </div>

      {/* Main Heatmap Matrix Visualizer */}
      {viewMode === 'heatmap' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl aspect-[16/9] flex items-center justify-center">
            {/* Background Image */}
            <img
              src={selectedScene.imageUrl}
              alt="Clutter Scene"
              className="w-full h-full object-cover"
            />

            {/* Simulated Grad-CAM Thermal Matrix Layer */}
            <div
              className="absolute inset-0 grid grid-cols-8 grid-rows-8 pointer-events-none transition-opacity duration-300"
              style={{ opacity: heatmapOpacity }}
            >
              {heatmap.map((row, rIdx) =>
                row.map((val, cIdx) => {
                  const hue = (1 - val) * 240; // 240=blue, 0=red
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

            {/* Target Highlight Ring */}
            {selectedCandidate && (
              <div
                className="absolute border-2 border-emerald-400 rounded-lg shadow-lg shadow-emerald-500/50 pointer-events-none animate-pulse"
                style={{
                  top: `${selectedCandidate.bbox.ymin / 10}%`,
                  left: `${selectedCandidate.bbox.xmin / 10}%`,
                  width: `${(selectedCandidate.bbox.xmax - selectedCandidate.bbox.xmin) / 10}%`,
                  height: `${(selectedCandidate.bbox.ymax - selectedCandidate.bbox.ymin) / 10}%`,
                }}
              />
            )}

            {/* Opacity Slider Control */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">Grad-CAM Thermal Layer Opacity:</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={heatmapOpacity}
                onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                className="w-48 accent-amber-500 cursor-pointer"
              />
              <span className="text-amber-400 font-bold">{Math.round(heatmapOpacity * 100)}%</span>
            </div>
          </div>

          {/* Saliency Analysis Sidebar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Layer Feature Saliency</span>
            </h3>

            <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
              "{explainability.gradCamSummary}"
            </p>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Primary Activation Triggers:
              </span>
              {explainability.primaryFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-xs font-mono">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-200">{feat}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Region Weight Attribution:
              </span>
              {explainability.keyRegions.map((reg, idx) => (
                <div key={idx} className="space-y-1 mb-2">
                  <div className="flex justify-between text-[11px] font-mono text-slate-300">
                    <span>{reg.name}</span>
                    <span className="text-amber-400">{Math.round(reg.relevance * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${reg.relevance * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Side by Side Comparison Mode */}
      {viewMode === 'sidebyside' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase">Raw Input Clutter Scene</span>
              <span className="text-slate-500">No SAM Mask Applied</span>
            </div>
            <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[16/9]">
              <img src={selectedScene.imageUrl} alt="Raw Input" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold uppercase">SAM 3 Concept Glow Overlay</span>
              <span className="text-emerald-400 font-bold">Zero-Shot Segmented</span>
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-emerald-500/50 aspect-[16/9] shadow-xl shadow-emerald-500/10">
              <img src={selectedScene.imageUrl} alt="Segmented Output" className="w-full h-full object-cover filter brightness-90" />
              {selectedCandidate && (
                <div
                  className="absolute border-2 border-emerald-400 rounded-lg shadow-2xl shadow-emerald-500/80 bg-emerald-500/20 backdrop-blur-[1px] animate-pulse"
                  style={{
                    top: `${selectedCandidate.bbox.ymin / 10}%`,
                    left: `${selectedCandidate.bbox.xmin / 10}%`,
                    width: `${(selectedCandidate.bbox.xmax - selectedCandidate.bbox.xmin) / 10}%`,
                    height: `${(selectedCandidate.bbox.ymax - selectedCandidate.bbox.ymin) / 10}%`,
                  }}
                >
                  <span className="absolute -top-6 left-0 bg-emerald-500 text-slate-950 text-[10px] font-bold font-mono px-2 py-0.5 rounded">
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 font-mono">
            How SAM 3 Concept Segmentation Computes Visual Saliency
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Meta's SAM 3 utilizes promptable concept embeddings mapped directly onto vision transformer token layers.
            Instead of standard class logits, Warmer evaluates pixel-level affinity matrices between the prompt concept and image tokens.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 font-mono">1. Prompt Tokenization</h4>
              <p className="text-[11px] text-slate-400">
                Natural language query is converted to dense prompt embeddings via text encoder.
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 font-mono">2. Vision Feature Maps</h4>
              <p className="text-[11px] text-slate-400">
                High-resolution image grid extracted through vision transformer backbone.
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 font-mono">3. Cross-Attention Mask</h4>
              <p className="text-[11px] text-slate-400">
                Pixel-level affinity computed, generating zero-shot segment masks across video frames.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
