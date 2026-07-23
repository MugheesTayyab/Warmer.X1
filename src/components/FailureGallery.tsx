import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, HelpCircle, CheckCircle2, ChevronRight, XCircle, Info } from 'lucide-react';
import { FAILURE_CASES } from '../data/sampleScenes';
import { FailureCase } from '../types';

export const FailureGallery: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<FailureCase>(FAILURE_CASES[0]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Error Analysis & Failure Gallery</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Proactive analysis of edge cases where vision models fail and Warmer's graceful degradation strategies.
          </p>
        </div>

        <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Graceful Fallback Compliant</span>
        </div>
      </div>

      {/* Main Failure Case Selector & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case List Selector */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Documented Real-World Edge Cases:
          </h3>
          {FAILURE_CASES.map((item) => {
            const isSelected = selectedCase.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedCase(item)}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-amber-500/80 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/50'
                }`}
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                    {item.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                </div>
                <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-600'}`} />
              </div>
            );
          })}
        </div>

        {/* Detailed Inspector Panel */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                {selectedCase.category}
              </span>
              <h3 className="text-lg font-bold text-slate-100 mt-2">{selectedCase.title}</h3>
            </div>
          </div>

          {/* Scenario & Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[4/3]">
              <img src={selectedCase.imageUrl} alt={selectedCase.title} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-500 uppercase font-bold block">Failure Scenario Context:</span>
              <p className="text-slate-200 leading-relaxed">{selectedCase.scenario}</p>
            </div>
          </div>

          {/* Analysis Breakdown */}
          <div className="space-y-3">
            <div className="bg-rose-950/30 border border-rose-500/30 p-4 rounded-xl space-y-1.5">
              <h4 className="text-xs font-bold font-mono text-rose-400 flex items-center space-x-1.5">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Why Standard CV Models Fail:</span>
              </h4>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">{selectedCase.whyItFailed}</p>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl space-y-1.5">
              <h4 className="text-xs font-bold font-mono text-emerald-400 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Warmer System Mitigation:</span>
              </h4>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">{selectedCase.systemMitigation}</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1.5">
              <h4 className="text-xs font-bold font-mono text-amber-400 flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-amber-400" />
                <span>CV Engineering Lesson Learned:</span>
              </h4>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">{selectedCase.lessonLearned}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
