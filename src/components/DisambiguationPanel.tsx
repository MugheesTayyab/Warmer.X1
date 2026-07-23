import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { FrameAnalysisResult } from '../types';

interface DisambiguationPanelProps {
  analysisResult: FrameAnalysisResult | null;
  onSelectCandidate: (index: number) => void;
}

export const DisambiguationPanel: React.FC<DisambiguationPanelProps> = ({
  analysisResult,
  onSelectCandidate,
}) => {
  if (!analysisResult || analysisResult.candidates.length === 0) {
    return (
      <div className="bg-[#151517] border border-[rgba(245,245,243,0.08)] rounded-2xl p-6 text-center text-[#A3A3A0] space-y-2 font-sans max-w-xl mx-auto">
        <Sparkles className="w-6 h-6 text-[#A3A3A0] mx-auto opacity-60" strokeWidth={1.5} />
        <h3 className="text-sm font-medium text-[#F5F5F3]">No Disambiguation Active</h3>
        <p className="text-xs text-[#5C5C5A]">
          When multiple similar candidates are detected, candidate selection will surface here.
        </p>
      </div>
    );
  }

  const { candidates, selectedCandidateIndex } = analysisResult;

  return (
    <div className="bg-[#151517] border border-[rgba(245,245,243,0.08)] rounded-20px rounded-2xl p-5 shadow-2xl font-sans max-w-2xl mx-auto space-y-4">
      {/* Sheet Header (§3.6) */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#F5F5F3]">
          Found {candidates.length} matches — which one?
        </h3>
        <span className="text-xs text-[#5C5C5A]">Tap to select</span>
      </div>

      {/* 64x64px Thumbnail Grid (§3.6) */}
      <div className="flex items-center space-x-4 overflow-x-auto pt-1 no-scrollbar">
        {candidates.map((cand, idx) => {
          const isSelected = selectedCandidateIndex === idx;
          return (
            <div
              key={cand.id}
              onClick={() => onSelectCandidate(idx)}
              className={`cursor-pointer p-3 rounded-xl border transition flex items-center space-x-3 ${
                isSelected
                  ? 'bg-[#1f1f23] border-[#FF7A3D]'
                  : 'bg-[#0A0A0B] border-[rgba(245,245,243,0.08)] hover:border-[rgba(245,245,243,0.24)]'
              }`}
            >
              {/* 64x64px Tile */}
              <div className="w-16 h-16 rounded-xl bg-[#151517] border border-[#7A3E24] flex items-center justify-center overflow-hidden shrink-0 relative">
                <span className="text-xs font-bold text-[#F5F5F3]">#{idx + 1}</span>
                {isSelected && (
                  <div className="absolute inset-0 bg-[#FF7A3D]/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-[#FF7A3D]" strokeWidth={2} />
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#F5F5F3]">{cand.label}</h4>
                <p className="text-[11px] text-[#A3A3A0] mt-0.5 max-w-[180px] line-clamp-2">
                  {cand.disambiguationNote || `${Math.round(cand.confidence * 100)}% saliency match`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
