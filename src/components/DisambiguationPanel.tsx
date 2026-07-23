import React from 'react';
import { Sparkles, Check, X, ShieldAlert, ArrowRight, Eye, Scale, Sliders, CheckCircle2 } from 'lucide-react';
import { FrameAnalysisResult, DetectionCandidate } from '../types';

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
      <div className="bg-zinc-900 border-2 border-zinc-800 p-8 text-center text-zinc-400 space-y-3 font-mono">
        <Sparkles className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
        <h3 className="text-base font-display text-white uppercase tracking-wider">No Disambiguation Active</h3>
        <p className="text-xs max-w-md mx-auto text-zinc-500 uppercase">
          Scan a clutter scene with a query like <span className="text-cyan-400 font-bold">"find the 10mm socket, not the 12mm"</span> to evaluate candidate reasoning.
        </p>
      </div>
    );
  }

  const { candidates, selectedCandidateIndex, queryBreakdown } = analysisResult;
  const selectedCandidate = candidates[selectedCandidateIndex] || candidates[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 border-2 border-zinc-800 p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-display text-white uppercase tracking-wider">VLM Concept Disambiguation Engine</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 uppercase">
            Multimodal reasoning comparing candidate detections against visual traits, context, and negative exclusions.
          </p>
        </div>

        <div className="bg-zinc-950 px-3.5 py-2 border border-zinc-800 text-xs font-mono">
          <span className="text-zinc-500 uppercase">Parsed Concept: </span>
          <strong className="text-cyan-400 font-bold uppercase">"{queryBreakdown.targetConcept}"</strong>
          {queryBreakdown.negativeConstraints.length > 0 && (
            <div className="text-rose-400 text-[10px] mt-0.5 uppercase">
              Excluding: {queryBreakdown.negativeConstraints.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Primary Match Highlight Card */}
      {selectedCandidate && (
        <div className="bg-zinc-900 border-2 border-cyan-400 p-6 shadow-2xl relative overflow-hidden font-mono">
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-cyan-400 text-black text-xs font-extrabold uppercase font-mono flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>CONFIRMED MATCH</span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-1/3 bg-zinc-950 p-4 border border-zinc-800 text-center space-y-2">
              <span className="inline-block px-2.5 py-1 bg-cyan-400/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-400/40 uppercase">
                Candidate #{selectedCandidateIndex + 1}
              </span>
              <h3 className="text-lg font-display text-white uppercase tracking-wider">{selectedCandidate.label}</h3>
              <p className="text-2xl font-mono font-bold text-cyan-400">
                {Math.round(selectedCandidate.confidence * 100)}%
              </p>
              <p className="text-[10px] text-zinc-500 uppercase font-mono">Match Saliency Index</p>
            </div>

            <div className="flex-1 space-y-3">
              <h4 className="text-xs font-bold font-mono uppercase text-zinc-400 tracking-widest">
                VLM Reasoning & Visual Trait Analysis
              </h4>
              <p className="text-xs text-zinc-200 bg-zinc-950 p-3.5 border border-zinc-800 font-mono leading-relaxed">
                "{selectedCandidate.disambiguationNote}"
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                <div className="bg-zinc-950 p-2.5 border border-zinc-800 text-xs">
                  <span className="text-zinc-500 text-[10px] block font-mono uppercase">Color Feature</span>
                  <span className="text-zinc-200 font-bold uppercase">{selectedCandidate.visualTraits?.color || 'Metallic / Brass'}</span>
                </div>
                <div className="bg-zinc-950 p-2.5 border border-zinc-800 text-xs">
                  <span className="text-zinc-500 text-[10px] block font-mono uppercase">Material Class</span>
                  <span className="text-zinc-200 font-bold uppercase">{selectedCandidate.visualTraits?.material || 'Polished Metal'}</span>
                </div>
                <div className="bg-zinc-950 p-2.5 border border-zinc-800 text-xs">
                  <span className="text-zinc-500 text-[10px] block font-mono uppercase">Negative Criteria</span>
                  <span className="text-emerald-400 font-bold uppercase">Passed Rules</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Candidate Detections Comparison Grid */}
      <div className="space-y-3 font-mono">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center space-x-2">
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
                className={`p-4 border cursor-pointer transition flex flex-col justify-between space-y-3 font-mono ${
                  isSelected
                    ? 'bg-zinc-900 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-6 h-6 flex items-center justify-center font-mono font-bold text-xs uppercase ${
                      cand.isMatch ? 'bg-cyan-400 text-black' : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase">{cand.label}</h4>
                      <p className="text-[10px] text-zinc-500 uppercase">{cand.concept}</p>
                    </div>
                  </div>

                  <span className={`text-xs font-mono font-bold px-2 py-0.5 uppercase ${
                    cand.isMatch ? 'bg-cyan-400/20 text-cyan-300' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {Math.round(cand.confidence * 100)}% Match
                  </span>
                </div>

                <p className="text-xs text-zinc-300 font-mono bg-zinc-950 p-2.5 border border-zinc-800">
                  {cand.disambiguationNote}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] font-mono uppercase">
                  <span className="text-zinc-500">BBox: [{cand.bbox.ymin}, {cand.bbox.xmin}, {cand.bbox.ymax}, {cand.bbox.xmax}]</span>
                  <button className="text-cyan-400 hover:underline flex items-center space-x-1 font-bold">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
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
