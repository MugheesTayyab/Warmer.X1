import React, { useState } from 'react';
import { Cpu, Layers, Grid, Info, Check } from 'lucide-react';
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
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.6);

  if (!analysisResult) {
    return (
      <div className="bg-[#151517] border border-[rgba(245,245,243,0.08)] rounded-2xl p-8 text-center text-[#A3A3A0] space-y-2 font-sans max-w-xl mx-auto">
        <Cpu className="w-6 h-6 text-[#A3A3A0] mx-auto opacity-60" strokeWidth={1.5} />
        <h3 className="text-sm font-medium text-[#F5F5F3]">No Heatmap Available</h3>
        <p className="text-xs text-[#5C5C5A]">
          Scan a clutter scene first to extract Grad-CAM layer attention maps.
        </p>
      </div>
    );
  }

  const { explainability, candidates, selectedCandidateIndex } = analysisResult;
  const selectedCandidate = candidates[selectedCandidateIndex] || candidates[0];
  const heatmap = explainability?.heatmapMatrix || [];

  return (
    <div className="space-y-4 font-sans max-w-4xl mx-auto">
      {/* Header & Tabs */}
      <div className="bg-[#151517] border border-[rgba(245,245,243,0.08)] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#F5F5F3]">Grad-CAM Feature Saliency</h2>
          <p className="text-xs text-[#A3A3A0]">Visualizing neural activation layer attention maps.</p>
        </div>

        <div className="flex items-center space-x-1 bg-[#0A0A0B] p-1 rounded-xl border border-[rgba(245,245,243,0.08)] text-xs">
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === 'heatmap' ? 'bg-[#F5F5F3] text-[#0A0A0B]' : 'text-[#A3A3A0] hover:text-[#F5F5F3]'
            }`}
          >
            <Grid className="w-3.5 h-3.5 inline mr-1" strokeWidth={1.5} />
            Heatmap
          </button>
          <button
            onClick={() => setViewMode('sidebyside')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === 'sidebyside' ? 'bg-[#F5F5F3] text-[#0A0A0B]' : 'text-[#A3A3A0] hover:text-[#F5F5F3]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" strokeWidth={1.5} />
            Before/After
          </button>
          <button
            onClick={() => setViewMode('features')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === 'features' ? 'bg-[#F5F5F3] text-[#0A0A0B]' : 'text-[#A3A3A0] hover:text-[#F5F5F3]'
            }`}
          >
            <Info className="w-3.5 h-3.5 inline mr-1" strokeWidth={1.5} />
            Attribution
          </button>
        </div>
      </div>

      {/* Main Heatmap Stage */}
      {viewMode === 'heatmap' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative rounded-2xl overflow-hidden bg-[#0A0A0B] border border-[rgba(245,245,243,0.08)] aspect-[16/9] flex items-center justify-center">
            <img src={selectedScene.imageUrl} alt="Clutter Scene" className="w-full h-full object-cover" />

            <div
              className="absolute inset-0 grid grid-cols-8 grid-rows-8 pointer-events-none transition-opacity duration-300"
              style={{ opacity: heatmapOpacity }}
            >
              {heatmap.map((row, rIdx) =>
                row.map((val, cIdx) => (
                  <div
                    key={`${rIdx}_${cIdx}`}
                    className="border border-black/10 flex items-center justify-center text-[9px] font-mono text-white/80"
                    style={{
                      backgroundColor: val > 0.15 ? `rgba(245, 245, 243, ${val * 0.4})` : 'transparent',
                    }}
                  >
                    {val > 0.3 && `${Math.round(val * 100)}%`}
                  </div>
                ))
              )}
            </div>

            {selectedCandidate && (
              <div
                className="absolute border border-[#FF7A3D] rounded-lg pointer-events-none"
                style={{
                  top: `${selectedCandidate.bbox.ymin / 10}%`,
                  left: `${selectedCandidate.bbox.xmin / 10}%`,
                  width: `${(selectedCandidate.bbox.xmax - selectedCandidate.bbox.xmin) / 10}%`,
                  height: `${(selectedCandidate.bbox.ymax - selectedCandidate.bbox.ymin) / 10}%`,
                }}
              />
            )}
          </div>

          <div className="bg-[#151517] border border-[rgba(245,245,243,0.08)] rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-[#F5F5F3]">Saliency Summary</h3>
            <p className="text-xs text-[#A3A3A0] leading-relaxed">
              "{explainability.gradCamSummary}"
            </p>

            <div className="space-y-1.5 pt-2 border-t border-[rgba(245,245,243,0.08)]">
              <span className="text-[11px] font-medium text-[#5C5C5A] uppercase tracking-wider block">
                Primary Features:
              </span>
              {explainability.primaryFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-xs text-[#F5F5F3]">
                  <Check className="w-3.5 h-3.5 text-[#A3A3A0]" strokeWidth={1.5} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
