import React from 'react';
import { Target, Download, Settings, ShieldCheck, Sparkles, AlertTriangle, FileCode2, Cpu, Volume2, VolumeX } from 'lucide-react';
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
    <header className="bg-[#050505] border-b-2 border-zinc-800 text-white sticky top-0 z-40 shadow-2xl">
      {/* Top micro status ticker */}
      <div className="bg-zinc-950 border-b border-zinc-900 px-4 py-1 flex items-center justify-between font-mono text-[10px] text-zinc-400 tracking-widest uppercase">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 text-cyan-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>System Active // Neural Link 01</span>
          </span>
          <span className="hidden md:inline text-zinc-600">|</span>
          <span className="hidden md:inline text-zinc-400">LATENCY: 18.4ms</span>
          <span className="hidden md:inline text-zinc-600">|</span>
          <span className="hidden md:inline text-zinc-400">BACKEND: {settings.modelBackend}</span>
        </div>
        <div className="flex items-center space-x-3 text-zinc-500">
          <span>GPU LOAD: 38%</span>
          <span>FPS: {settings.motionGatedFps}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('live')}>
            <div className="relative flex items-center justify-center w-10 h-10 bg-zinc-900 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Target className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-cyan-400"></div>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-cyan-400"></div>
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-display uppercase tracking-tight text-white leading-none">
                  WARMER<span className="text-cyan-400">.X1</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/40 uppercase">
                  SAM 3 + VLM
                </span>
              </div>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider hidden sm:block">
                Open-Vocab Clutter Detection Engine
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-zinc-900/90 p-1 border border-zinc-800 font-mono text-xs uppercase tracking-wider">
            <button
              id="tab-live-tracker"
              onClick={() => setActiveTab('live')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 font-bold transition-all ${
                activeTab === 'live'
                  ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Live Feed</span>
            </button>

            <button
              id="tab-disambiguation"
              onClick={() => setActiveTab('disambiguation')}
              className={`relative flex items-center space-x-1.5 px-3 py-1.5 font-bold transition-all ${
                activeTab === 'disambiguation'
                  ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Disambiguate</span>
              {candidateCount > 1 && (
                <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-amber-400 text-black font-extrabold">
                  {candidateCount}
                </span>
              )}
            </button>

            <button
              id="tab-explainability"
              onClick={() => setActiveTab('explainability')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 font-bold transition-all ${
                activeTab === 'explainability'
                  ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Grad-CAM</span>
            </button>

            <button
              id="tab-failure-gallery"
              onClick={() => setActiveTab('failures')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 font-bold transition-all ${
                activeTab === 'failures'
                  ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Error Logs</span>
            </button>

            <button
              id="tab-playbook-specs"
              onClick={() => setActiveTab('specs')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 font-bold transition-all ${
                activeTab === 'specs'
                  ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>CV Matrix</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3 font-mono">
            <button
              id="btn-toggle-audio"
              onClick={toggleAudio}
              title={settings.audioFeedback ? 'Audio Chimes Enabled' : 'Audio Chimes Muted'}
              className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
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
              title="System Settings & GPU Specs"
              className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              id="btn-generate-clip-modal"
              onClick={onOpenExport}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider transition"
            >
              <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Clip</span>
            </button>

            {/* Download Zip Deliverable Primary Action */}
            <button
              id="btn-download-project-zip"
              onClick={onDownloadZip}
              className="flex items-center space-x-2 px-4 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs uppercase tracking-widest transition active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            >
              <Download className="w-4 h-4 text-black" />
              <span className="hidden sm:inline">Download .ZIP</span>
              <span className="sm:hidden">ZIP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around bg-zinc-950 py-2 border-t border-zinc-800 px-2 overflow-x-auto space-x-1 text-xs font-mono uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-3 py-1 ${activeTab === 'live' ? 'bg-cyan-400 text-black font-bold' : 'text-zinc-400'}`}
        >
          Live Feed
        </button>
        <button
          onClick={() => setActiveTab('disambiguation')}
          className={`px-3 py-1 ${activeTab === 'disambiguation' ? 'bg-cyan-400 text-black font-bold' : 'text-zinc-400'}`}
        >
          Disambiguate
        </button>
        <button
          onClick={() => setActiveTab('explainability')}
          className={`px-3 py-1 ${activeTab === 'explainability' ? 'bg-cyan-400 text-black font-bold' : 'text-zinc-400'}`}
        >
          Heatmap
        </button>
        <button
          onClick={() => setActiveTab('failures')}
          className={`px-3 py-1 ${activeTab === 'failures' ? 'bg-cyan-400 text-black font-bold' : 'text-zinc-400'}`}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab('specs')}
          className={`px-3 py-1 ${activeTab === 'specs' ? 'bg-cyan-400 text-black font-bold' : 'text-zinc-400'}`}
        >
          Matrix
        </button>
      </div>
    </header>
  );
};
