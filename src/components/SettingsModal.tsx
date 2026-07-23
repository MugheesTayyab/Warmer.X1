import React from 'react';
import { X, Settings, Sliders, Volume2, Mic, Eye, Zap, Shield, Cpu } from 'lucide-react';
import { SystemSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  setSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Warmer CV Engine Settings</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs font-mono">
          {/* Confidence Threshold Slider */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-bold">Detection Confidence Threshold:</span>
              <span className="text-amber-400 font-bold">{Math.round(settings.confidenceThreshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.95"
              step="0.05"
              value={settings.confidenceThreshold}
              onChange={(e) => setSettings((p) => ({ ...p, confidenceThreshold: parseFloat(e.target.value) }))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Higher values reduce false positives in heavy clutter; lower values reveal heavily occluded targets.
            </p>
          </div>

          {/* Model Backend Selector */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-300 font-bold block">Model Pipeline Backend:</span>
            <select
              value={settings.modelBackend}
              onChange={(e) => setSettings((p) => ({ ...p, modelBackend: e.target.value as any }))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="SAM3_GPU">Meta SAM 3 (848M) + Gemini 3.6 Flash VLM</option>
              <option value="SAM3_1_REALTIME">Meta SAM 3.1 Realtime ONNX Engine</option>
              <option value="HYBRID_VLM">Hybrid Edge-Cloud Disambiguation Pipeline</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer">
              <span className="text-slate-300">Audio Chimes</span>
              <input
                type="checkbox"
                checked={settings.audioFeedback}
                onChange={(e) => setSettings((p) => ({ ...p, audioFeedback: e.target.checked }))}
                className="accent-amber-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer">
              <span className="text-slate-300">Voice Guidance</span>
              <input
                type="checkbox"
                checked={settings.speechGuidance}
                onChange={(e) => setSettings((p) => ({ ...p, speechGuidance: e.target.checked }))}
                className="accent-amber-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer">
              <span className="text-slate-300">Grad-CAM Overlay</span>
              <input
                type="checkbox"
                checked={settings.explainabilityMode}
                onChange={(e) => setSettings((p) => ({ ...p, explainabilityMode: e.target.checked }))}
                className="accent-amber-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer">
              <span className="text-slate-300">High Contrast</span>
              <input
                type="checkbox"
                checked={settings.highContrastMode}
                onChange={(e) => setSettings((p) => ({ ...p, highContrastMode: e.target.checked }))}
                className="accent-amber-500 w-4 h-4"
              />
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 transition"
          >
            Apply & Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
