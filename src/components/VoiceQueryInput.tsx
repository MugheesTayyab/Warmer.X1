import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Search, Sparkles, Filter, X, Volume2 } from 'lucide-react';
import { audioEngine } from '../lib/audioEngine';

interface VoiceQueryInputProps {
  query: string;
  setQuery: (q: string) => void;
  negativeExemplars: string;
  setNegativeExemplars: (neg: string) => void;
  onAnalyzeTrigger: () => void;
  isAnalyzing: boolean;
}

export const VoiceQueryInput: React.FC<VoiceQueryInputProps> = ({
  query,
  setQuery,
  negativeExemplars,
  setNegativeExemplars,
  onAnalyzeTrigger,
  isAnalyzing,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showNegative, setShowNegative] = useState(false);

  const presets = [
    { label: 'KEYS_BRASS', text: 'find my brass keys, not my roommate silver keychain' },
    { label: 'SOCKET_10MM', text: 'find the 10mm socket, not the 12mm' },
    { label: 'CABLE_USBC', text: 'find the braided USB-C cable with red accents' },
    { label: 'INHALER_RED', text: 'find my daughter red asthma inhaler in couch cushions' },
    { label: 'WALLET_LEATHER', text: 'find my black leather wallet under the mail' },
  ];

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      
      setQuery(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.start();
    } else {
      recognition.stop();
    }

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [isListening, setQuery]);

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      audioEngine.speak('Listening for target object');
    }
  };

  const handlePresetSelect = (presetText: string) => {
    setQuery(presetText);
    if (presetText.includes('not the')) {
      const parts = presetText.split('not the');
      if (parts.length > 1) {
        setNegativeExemplars(`not the ${parts[1].trim()}`);
      }
    }
  };

  return (
    <div className="bg-zinc-900 border-2 border-zinc-800 p-4 shadow-2xl relative">
      <div className="flex items-center justify-between mb-2 border-b border-zinc-800 pb-2">
        <span className="font-mono text-[10px] text-cyan-400 tracking-[0.3em] font-bold uppercase flex items-center space-x-2">
          <span className="w-1.5 h-1.5 bg-cyan-400"></span>
          <span>Target Query Parameter Input</span>
        </span>
        <span className="font-mono text-[10px] text-zinc-500 uppercase">
          NLP_ENCODER // PROMPT_MATRIX
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Mic Button */}
        <button
          id="btn-voice-recording-mic"
          type="button"
          onClick={toggleMic}
          className={`relative p-3.5 flex items-center justify-center transition-all border font-mono ${
            isListening
              ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.4)]'
              : 'bg-zinc-950 text-cyan-400 border-zinc-800 hover:border-cyan-400'
          }`}
          title={isListening ? 'Click to stop listening' : 'Click to speak search query'}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
          {isListening && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 bg-rose-500"></span>
            </span>
          )}
        </button>

        {/* Main Query Input */}
        <div className="relative flex-1 w-full font-mono">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-target-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAnalyzeTrigger()}
            placeholder="TYPE_QUERY: 'find my brass keys, not my roommate silver keychain'..."
            className="w-full pl-10 pr-28 py-3 bg-zinc-950 border border-zinc-800 text-cyan-300 placeholder-zinc-600 text-xs focus:outline-none focus:border-cyan-400 font-mono transition"
          />

          <div className="absolute inset-y-0 right-1.5 flex items-center">
            <button
              id="btn-toggle-negative-constraint"
              type="button"
              onClick={() => setShowNegative(!showNegative)}
              className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider border transition ${
                showNegative || negativeExemplars
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
              title="Add negative exclusion criteria ('not the...')"
            >
              <Filter className="w-3 h-3 inline mr-1" />
              Exclusions
            </button>
          </div>
        </div>

        {/* Trigger Search Button */}
        <button
          id="btn-trigger-sam-scan"
          type="button"
          onClick={onAnalyzeTrigger}
          disabled={isAnalyzing}
          className="w-full md:w-auto px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold font-mono text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(34,211,238,0.25)] disabled:opacity-50 transition active:scale-95"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin" />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-black fill-current" />
              <span>Scan Clutter</span>
            </>
          )}
        </button>
      </div>

      {/* Optional Negative Constraint Input */}
      {(showNegative || negativeExemplars) && (
        <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2 text-xs font-mono">
          <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center text-[10px]">
            <Filter className="w-3 h-3 mr-1" /> Negative Exclusion:
          </span>
          <input
            id="input-negative-exemplars"
            type="text"
            value={negativeExemplars}
            onChange={(e) => setNegativeExemplars(e.target.value)}
            placeholder="EXCLUDE: 'not the 12mm socket', 'not silver fob'"
            className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-zinc-200 placeholder-zinc-700 text-xs focus:outline-none focus:border-amber-400"
          />
          {negativeExemplars && (
            <button
              id="btn-clear-negative-exemplars"
              onClick={() => setNegativeExemplars('')}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Preset Quick Suggestions */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono no-scrollbar">
        <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold whitespace-nowrap">
          Quick Prompts:
        </span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            id={`preset-prompt-${idx}`}
            onClick={() => handlePresetSelect(p.text)}
            className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-400 text-zinc-300 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};
