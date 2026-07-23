import React, { useState } from 'react';
import { X, Download, Play, Share2, Sparkles, CheckCircle, FileVideo, Film, Check } from 'lucide-react';
import { triggerProjectZipDownload } from '../lib/clientZip';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadZip: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onDownloadZip,
}) => {
  const [isPlayingClip, setIsPlayingClip] = useState(false);
  const [clipStep, setClipStep] = useState<number>(0);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const playDemoClipSequence = () => {
    setIsPlayingClip(true);
    setClipStep(1); // 0-2s: Chaos Clutter

    setTimeout(() => setClipStep(2), 2000); // 2-4s: Voice query "Find my keys"
    setTimeout(() => setClipStep(3), 4000); // 4-6s: Camera sweep
    setTimeout(() => setClipStep(4), 6000); // 6-12s: Glowing match chime
    setTimeout(() => {
      setClipStep(5);
      setIsPlayingClip(false);
    }, 12000);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Export & Share Deliverable</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Deliverable Project .ZIP Export Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500 text-slate-950 rounded-xl font-bold">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono">Complete Project Package (.ZIP)</h3>
              <p className="text-xs text-slate-400">
                Full React 19 + Express + SAM 3 + Gemini CV engine source code package.
              </p>
            </div>
          </div>

          <button
            onClick={onDownloadZip}
            className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Project .ZIP Archive Now</span>
          </button>
        </div>

        {/* 15-Second Vertical Demo Video Simulator */}
        <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-bold flex items-center space-x-1.5">
              <Film className="w-4 h-4 text-amber-400" />
              <span>15s Shareable Video Clip Generator</span>
            </span>
            <span className="text-slate-500">Vertical 9:16 Format</span>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-[9/12] max-w-[220px] mx-auto border border-slate-800 flex flex-col items-center justify-center text-center p-4">
            <img
              src="https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80"
              alt="Clutter"
              className="absolute inset-0 w-full h-full object-cover filter brightness-75"
            />

            {/* Simulation Overlay Steps */}
            {clipStep === 1 && (
              <div className="relative z-10 bg-slate-950/80 p-2 rounded text-[10px] text-slate-200 font-mono">
                0-2s: Real Clutter Field
              </div>
            )}

            {clipStep === 2 && (
              <div className="relative z-10 bg-amber-500 text-slate-950 font-bold p-2 rounded text-[11px] font-mono animate-bounce">
                🎙️ "Find my keys!"
              </div>
            )}

            {clipStep === 3 && (
              <div className="relative z-10 bg-slate-950/80 p-2 rounded text-[10px] text-amber-400 font-mono">
                4-6s: Camera Sweep...
              </div>
            )}

            {clipStep === 4 && (
              <div className="relative z-10 border-2 border-emerald-400 p-3 rounded-lg bg-emerald-500/30 text-emerald-300 font-bold text-xs animate-pulse">
                🎯 TARGET GLOW!
              </div>
            )}

            <div className="absolute bottom-2 left-2 right-2 bg-slate-950/90 text-[9px] font-mono text-slate-400 py-1 rounded">
              Made with Warmer AI
            </div>

            {!isPlayingClip && (
              <button
                onClick={playDemoClipSequence}
                className="relative z-20 p-3 bg-amber-500/90 text-slate-950 rounded-full shadow-lg hover:scale-110 transition"
              >
                <Play className="w-5 h-5 fill-current" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={copyShareLink}
              className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-mono font-medium flex items-center space-x-1.5 hover:bg-slate-700"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Link Copied!' : 'Copy Share Link'}</span>
            </button>

            <button
              onClick={playDemoClipSequence}
              className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-mono font-bold hover:bg-amber-500/30"
            >
              Preview 15s Clip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
