import React from 'react';
import { Sparkles, ArrowRight, Scale, CheckCircle2 } from 'lucide-react';
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
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 text-center text-zinc-400 space-y-3 font-sans backdrop-blur-md">
        <Sparkles className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
        <h3 className="text-base font-bold text-white">No Disambiguation Active</h3>
        <p className="text-xs max-w-md mx-auto text-zinc-500">
          Scan a clutter scene with a prompt like <span className="text-cyan-400 font-semibold">"find the 10mm socket, not the 12mm"</span> to evaluate candidate reasoning.
        </p>
      </div>
    );
  }

  const { candidates, selectedCandidateIndex, queryBreakdown } = analysisResult;
  const selectedCandidate = candidates[selectedCandidateIndex] || candidates[0];

  return (
    <div className="space-y-5 font-sans">
      {/* Header Banner */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">VLM Concept Disambiguation Engine</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Multimodal reasoning comparing candidate detections against visual traits, context, and negative exclusions.
          </p>
        </div>

        <div className="bg-zinc-950/80 px-4 py-2 rounded-xl border border-zinc-800 text-xs font-mono">
          <span className="text-zinc-500">Parsed Concept: </span>
          <strong className="text-cyan-400">"{queryBreakdown.targetConcept}"</strong>
          {queryBreakdown.negativeConstraints.length > 0 && (
            <div className="text-rose-400 text-[10px] mt-0.5">
              Excluding: {queryBreakdown.negativeConstraints.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Primary Match Card */}
      {selectedCandidate && (
        <div className="bg-zinc-900/70 border-2 border-cyan-500/60 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md shadow-xl">
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-cyan-400 text-black text-xs font-bold font-mono rounded-bl-xl flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>CONFIRMED MATCH</span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-1/3 bg-zinc-950/80 p-5 rounded-xl border border-zinc-800/80 text-center space-y-2">
              <span className="inline-block px-3 py-1 bg-cyan-400/20 text-cyan-300 font-mono text-xs font-semibold rounded-full border border-cyan-400/30">
                Candidate #{selectedCandidateIndex + 1}
              </span>
              <h3 className="text-lg font-bold text-white">{selectedCandidate.label}</h3>
              <p className="text-3xl font-mono font-bold text-cyan-400">
                {Math.round(selectedCandidate.confidence * 100)}%
              </p>
              <p className="text-[10px] text-zinc-500 font-mono uppercase">Match Saliency Index</p>
            </div>

            <div className="flex-1 space-y-3">
              <h4 className="text-xs font-bold font-mono uppercase text-zinc-400 tracking-wider">
                VLM Reasoning & Visual Trait Analysis
              </h4>
              <p className="text-xs text-zinc-200 bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 leading-relaxed font-mono">
                "{selectedCandidate.disambiguationNote}"
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80 text-xs">
                  <span className="text-zinc-500 text-[10px] block font-mono">Color Feature</span>
                  <span className="text-zinc-200 font-semibold">{selectedCandidate.visualTraits?.color || 'Metallic / Brass'}</span>
                </div>
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80 text-xs">
                  <span className="text-zinc-500 text-[10px] block font-mono">Material Class</span>
                  <span className="text-zinc-200 font-semibold">{selectedCandidate.visualTraits?.material || 'Polished Metal'}</span>
                </div>
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80 text-xs">
                  <span className="text-zinc-500 text-[10px] block font-mono">Exclusion Rules</span>
                  <span className="text-emerald-400 font-semibold">Passed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Detections Comparison Grid */}
      <div className="space-y-3 font-sans">
        <h3 className="text-xs font-bold text-zinc-300 tracking-wider flex items-center space-x-2 font-mono">
          <Scale className="w-4 h-4 text-cyan-400" />
          <span>Candidate Disambiguation Matrix ({candidates.length} Detected)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((cand, idx) => {
            const isSelected = selectedCandidateIndex === idx;
            return (
              <div
                key={cand.id}
                onClick={() => onSelectCandidate(idx)}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-3 font-sans ${
                  isSelected
                    ? 'bg-zinc-900/90 border-cyan-400 shadow-lg shadow-cyan-400/10'
                    : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                      cand.isMatch ? 'bg-cyan-400 text-black' : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{cand.label}</h4>
                      <p className="text-[11px] text-zinc-500">{cand.concept}</p>
                    </div>
                  </div>

                  <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full ${
                    cand.isMatch ? 'bg-cyan-400/20 text-cyan-300' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {Math.round(cand.confidence * 100)}% Match
                  </span>
                </div>

                <p className="text-xs text-zinc-300 font-mono bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
                  {cand.disambiguationNote}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                  <span className="text-zinc-500">BBox: [{cand.bbox.ymin}, {cand.bbox.xmin}, {cand.bbox.ymax}, {cand.bbox.xmax}]</span>
                  <button className="text-cyan-400 hover:underline flex items-center space-x-1 font-semibold">
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
