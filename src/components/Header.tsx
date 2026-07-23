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
    <header className="sticky top-0 z-40 bg-[#0A0A0B]/90 backdrop-blur-md border-b border-[rgba(245,245,243,0.08)] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Mark */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer"
            onClick={() => setActiveTab('live')}
          >
            <div className="w-8 h-8 rounded-lg bg-[#151517] border border-[rgba(245,245,243,0.08)] flex items-center justify-center">
              <Target className="w-4 h-4 text-[#F5F5F3]" strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight text-[#F5F5F3]">
                Warmer
              </span>
              <span className="ml-2 text-xs text-[#A3A3A0] hidden sm:inline">
                Open-Vocabulary Vision Engine
              </span>
            </div>
          </div>

          {/* Near-Monochrome Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-[#151517] p-1 rounded-xl border border-[rgba(245,245,243,0.08)] text-xs">
            <button
              id="tab-live-tracker"
              onClick={() => setActiveTab('live')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'live'
                  ? 'bg-[#F5F5F3] text-[#0A0A0B] font-semibold'
                  : 'text-[#A3A3A0] hover:text-[#F5F5F3]'
              }`}
            >
              <Target className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Camera</span>
            </button>

            <button
              id="tab-disambiguation"
              onClick={() => setActiveTab('disambiguation')}
              className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'disambiguation'
                  ? 'bg-[#F5F5F3] text-[#0A0A0B] font-semibold'
                  : 'text-[#A3A3A0] hover:text-[#F5F5F3]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Disambiguate</span>
              {candidateCount > 1 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-[#5C5C5A] text-[#F5F5F3] rounded-full font-bold">
                  {candidateCount}
                </span>
              )}
            </button>

            <button
              id="tab-explainability"
              onClick={() => setActiveTab('explainability')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'explainability'
                  ? 'bg-[#F5F5F3] text-[#0A0A0B] font-semibold'
                  : 'text-[#A3A3A0] hover:text-[#F5F5F3]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Heatmap</span>
            </button>

            <button
              id="tab-failure-gallery"
              onClick={() => setActiveTab('failures')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'failures'
                  ? 'bg-[#F5F5F3] text-[#0A0A0B] font-semibold'
                  : 'text-[#A3A3A0] hover:text-[#F5F5F3]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Logs</span>
            </button>

            <button
              id="tab-playbook-specs"
              onClick={() => setActiveTab('specs')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'specs'
                  ? 'bg-[#F5F5F3] text-[#0A0A0B] font-semibold'
                  : 'text-[#A3A3A0] hover:text-[#F5F5F3]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Specs</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-toggle-audio"
              onClick={toggleAudio}
              title={settings.audioFeedback ? 'Audio Guidance Active' : 'Audio Muted'}
              className="w-9 h-9 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#151517] border border-[rgba(245,245,243,0.08)] text-[#A3A3A0] hover:text-[#F5F5F3] transition"
            >
              {settings.audioFeedback ? (
                <Volume2 className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <VolumeX className="w-4 h-4 text-[#5C5C5A]" strokeWidth={1.5} />
              )}
            </button>

            <button
              id="btn-settings-modal"
              onClick={onOpenSettings}
              title="Settings"
              className="w-9 h-9 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#151517] border border-[rgba(245,245,243,0.08)] text-[#A3A3A0] hover:text-[#F5F5F3] transition"
            >
              <Settings className="w-4 h-4" strokeWidth={1.5} />
            </button>

            <button
              id="btn-download-project-zip"
              onClick={onDownloadZip}
              className="flex items-center space-x-2 px-3.5 py-2 min-h-[44px] rounded-xl bg-[#151517] border border-[rgba(245,245,243,0.08)] hover:bg-[#1f1f23] text-[#F5F5F3] font-medium text-xs transition"
            >
              <Download className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="lg:hidden flex items-center justify-around bg-[#0A0A0B] py-2 border-t border-[rgba(245,245,243,0.08)] text-xs text-[#A3A3A0]">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-3 py-1 rounded-lg ${activeTab === 'live' ? 'bg-[#F5F5F3] text-[#0A0A0B] font-semibold' : ''}`}
        >
          Camera
        </button>
        <button
          onClick={() => setActiveTab('disambiguation')}
          className={`px-3 py-1 rounded-lg ${activeTab === 'disambiguation' ? 'bg-[#F5F5F3] text-[#0A0A0B] font-semibold' : ''}`}
        >
          Disambiguate
        </button>
        <button
          onClick={() => setActiveTab('explainability')}
          className={`px-3 py-1 rounded-lg ${activeTab === 'explainability' ? 'bg-[#F5F5F3] text-[#0A0A0B] font-semibold' : ''}`}
        >
          Heatmap
        </button>
        <button
          onClick={() => setActiveTab('failures')}
          className={`px-3 py-1 rounded-lg ${activeTab === 'failures' ? 'bg-[#F5F5F3] text-[#0A0A0B] font-semibold' : ''}`}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab('specs')}
          className={`px-3 py-1 rounded-lg ${activeTab === 'specs' ? 'bg-[#F5F5F3] text-[#0A0A0B] font-semibold' : ''}`}
        >
          Specs
        </button>
      </div>
    </header>
  );
};
