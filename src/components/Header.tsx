import React from 'react';
import { Target, Download, Settings, ShieldCheck, Sparkles, AlertTriangle, Cpu, Volume2, VolumeX } from 'lucide-react';
import { SystemSettings } from '../types';
import { audioEngine } from '../lib/audioEngine';

interface HeaderProps {
  activeTab: 'live' | 'disambiguation' | 'explainability' | 'failures' | 'specs';
  setActiveTab: (tab: 'live' | 'disambiguation' | 'explainability' | 'failures' | 'specs') => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onDownloadZip: () => void;
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  candidateCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenExport,
  onDownloadZip,
  settings,
  setSettings,
  candidateCount,
}) => {
  const toggleAudio = () => {
    const newMuted = !settings.audioFeedback;
    setSettings((prev) => ({ ...prev, audioFeedback: newMuted }));
    audioEngine.setMuted(!newMuted);
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Minimal Brand & Status Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('live')}
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:border-cyan-400 transition">
              <Target className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-display font-black tracking-tight text-white">
                  WARMER<span className="text-cyan-400 font-extrabold">.X1</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] font-mono font-semibold bg-cyan-950/80 text-cyan-300 rounded border border-cyan-800/60 uppercase">
                  OpenRouter Free
                </span>
              </div>
              <p className="text-[10px] font-mono text-zinc-500 tracking-wider hidden sm:block">
                Open-Vocabulary Computer Vision Engine
              </p>
            </div>
          </div>

          {/* Minimalist Glassmorphism Navigation Pills */}
          <nav className="hidden lg:flex items-center space-x-1.5 bg-zinc-900/60 p-1.5 rounded-full border border-zinc-800/80 backdrop-blur-md font-mono text-xs">
            <button
              id="tab-live-tracker"
              onClick={() => setActiveTab('live')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all ${
                activeTab === 'live'
                  ? 'bg-cyan-400 text-black font-bold shadow-md shadow-cyan-400/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Live Vision</span>
            </button>

            <button
              id="tab-disambiguation"
              onClick={() => setActiveTab('disambiguation')}
              className={`relative flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all ${
                activeTab === 'disambiguation'
                  ? 'bg-cyan-400 text-black font-bold shadow-md shadow-cyan-400/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Disambiguate</span>
              {candidateCount > 1 && (
                <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-amber-400 text-black rounded-full font-bold">
                  {candidateCount}
                </span>
              )}
            </button>

            <button
              id="tab-explainability"
              onClick={() => setActiveTab('explainability')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all ${
                activeTab === 'explainability'
                  ? 'bg-cyan-400 text-black font-bold shadow-md shadow-cyan-400/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Heatmap</span>
            </button>

            <button
              id="tab-failure-gallery"
              onClick={() => setActiveTab('failures')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all ${
                activeTab === 'failures'
                  ? 'bg-cyan-400 text-black font-bold shadow-md shadow-cyan-400/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Error Logs</span>
            </button>

            <button
              id="tab-playbook-specs"
              onClick={() => setActiveTab('specs')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all ${
                activeTab === 'specs'
                  ? 'bg-cyan-400 text-black font-bold shadow-md shadow-cyan-400/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>CV Specs</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3 font-mono">
            <button
              id="btn-toggle-audio"
              onClick={toggleAudio}
              title={settings.audioFeedback ? 'Audio Chimes Enabled' : 'Audio Chimes Muted'}
              className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
            >
              {settings.audioFeedback ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-600" />
              )}
            </button>

            <button
              id="btn-settings-modal"
              onClick={onOpenSettings}
              title="System Settings & Model Config"
              className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              id="btn-download-project-zip"
              onClick={onDownloadZip}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs uppercase tracking-wider transition shadow-md shadow-cyan-400/20 active:scale-95"
            >
              <Download className="w-4 h-4 text-black" />
              <span className="hidden sm:inline">Export Deliverable</span>
              <span className="sm:hidden">ZIP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around bg-zinc-950/90 py-2 border-t border-zinc-800/80 px-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-3 py-1 rounded-full ${activeTab === 'live' ? 'bg-cyan-400 text-black font-bold' : 'text-zinc-400'}`}
        >
          Live
        </button>
        <button
          onClick={() => setActiveTab('disambiguation')}
          className={`px-3 py-1 rounded-full ${activeTab === 'disambiguation' ? 'bg-cyan-400 text-black font-bold' : 'text-zinc-400'}`}
        >
          Disambiguate
        </button>
        <button
          onClick={() => setActiveTab('explainability')}
          className={`px-3 py-1 rounded-full ${activeTab === 'explainability' ? 'bg-cyan-400 text-black font-bold' : 'text-zinc-400'}`}
        >
          Heatmap
        </button>
        <button
          onClick={() => setActiveTab('failures')}
          className={`px-3 py-1 rounded-full ${activeTab === 'failures' ? 'bg-cyan-400 text-black font-bold' : 'text-zinc-400'}`}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab('specs')}
          className={`px-3 py-1 rounded-full ${activeTab === 'specs' ? 'bg-cyan-400 text-black font-bold' : 'text-zinc-400'}`}
        >
          Specs
        </button>
      </div>
    </header>
  );
};
