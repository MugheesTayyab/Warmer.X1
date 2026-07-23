import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Search, Sparkles, Filter, X, Zap } from 'lucide-react';
import { audioEngine } from '../lib/audioEngine';
import { QueryParseResult } from '../types';

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
  const [parsedInfo, setParsedInfo] = useState<QueryParseResult | null>(null);
  const [isParsingQuery, setIsParsingQuery] = useState(false);

  const presets = [
    { label: 'Brass Keys', text: 'find my brass keys, not my roommate silver keychain' },
    { label: '10mm Socket', text: 'find the 10mm socket, not the 12mm' },
    { label: 'USB-C Cable', text: 'find the braided USB-C cable with red accents' },
    { label: 'Asthma Inhaler', text: 'find my daughter red asthma inhaler in couch cushions' },
    { label: 'Leather Wallet', text: 'find my black leather wallet under the mail' },
  ];

  const triggerQueryParser = async (rawQuery: string) => {
    if (!rawQuery || rawQuery.trim().length < 3) return;
    setIsParsingQuery(true);
    try {
      const res = await fetch('/api/parse-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: rawQuery }),
      });
      if (res.ok) {
        const data: QueryParseResult = await res.json();
        setParsedInfo(data);
        if (data.negativeConstraints.length > 0 && !negativeExemplars) {
          setNegativeExemplars(data.negativeConstraints.join(', '));
        }
      }
    } catch (err) {
      console.warn('Failed to call /api/parse-query:', err);
    } finally {
      setIsParsingQuery(false);
    }
  };

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
      triggerQueryParser(query);
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
  }, [isListening, query, setQuery]);

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
    triggerQueryParser(presetText);
    if (presetText.includes('not the')) {
      const parts = presetText.split('not the');
      if (parts.length > 1) {
        setNegativeExemplars(`not the ${parts[1].trim()}`);
      }
    }
  };

  const handleTriggerScan = () => {
    triggerQueryParser(query);
    onAnalyzeTrigger();
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 md:p-5 shadow-xl backdrop-blur-md space-y-3 font-sans">
      {/* Input Header Bar */}
      <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400">
        <span className="flex items-center space-x-2 font-medium text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Target Object Prompt</span>
        </span>
        <div className="flex items-center space-x-2 text-zinc-500 text-[10px]">
          {isParsingQuery && <span className="text-amber-400 animate-pulse">Parsing Concept...</span>}
          <span>SAM 3 Open-Vocabulary</span>
        </div>
      </div>

      {/* Main Search Bar & Action Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Mic Recording Button */}
        <button
          id="btn-voice-recording-mic"
          type="button"
          onClick={toggleMic}
          className={`p-3.5 rounded-xl border flex items-center justify-center transition-all ${
            isListening
              ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30 animate-pulse'
              : 'bg-zinc-950 text-cyan-400 border-zinc-800 hover:border-cyan-500/60 hover:bg-zinc-900'
          }`}
          title={isListening ? 'Click to stop listening' : 'Click to speak search prompt'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Input Container */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4.5 h-4.5" />
          </div>
          <input
            id="input-target-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTriggerScan()}
            onBlur={() => triggerQueryParser(query)}
            placeholder="Describe what you lost: 'find my brass keys, not my roommate silver keychain'..."
            className="w-full pl-10 pr-28 py-3.5 bg-zinc-950/90 border border-zinc-800/80 rounded-xl text-cyan-300 placeholder-zinc-500 text-xs focus:outline-none focus:border-cyan-400/80 font-mono transition"
          />

          <div className="absolute inset-y-0 right-2 flex items-center">
            <button
              id="btn-toggle-negative-constraint"
              type="button"
              onClick={() => setShowNegative(!showNegative)}
              className={`px-2.5 py-1 text-[10px] rounded-lg font-mono transition ${
                showNegative || negativeExemplars
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
              title="Add negative exclusion criteria"
            >
              <Filter className="w-3 h-3 inline mr-1" />
              Exclusions
            </button>
          </div>
        </div>

        {/* Scan CTA Button */}
        <button
          id="btn-trigger-sam-scan"
          type="button"
          onClick={handleTriggerScan}
          disabled={isAnalyzing}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold font-mono text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-cyan-400/20 disabled:opacity-50 transition active:scale-95"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-black fill-current" />
              <span>Scan Scene</span>
            </>
          )}
        </button>
      </div>

      {/* Parsed Concept Badge */}
      {parsedInfo && (
        <div className="px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-cyan-900/40 text-[11px] font-mono text-zinc-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-400 font-bold">Concept:</span>
            <span className="text-white font-semibold">"{parsedInfo.targetConcept}"</span>
            {parsedInfo.attributes?.color && (
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                {parsedInfo.attributes.color}
              </span>
            )}
          </div>
          <span className="text-zinc-500 text-[10px] italic">{parsedInfo.searchStrategy}</span>
        </div>
      )}

      {/* Negative Exclusion Input */}
      {(showNegative || negativeExemplars) && (
        <div className="pt-2 flex items-center gap-2 text-xs font-mono">
          <span className="text-amber-400 font-medium text-[11px] flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" /> Exclude:
          </span>
          <input
            id="input-negative-exemplars"
            type="text"
            value={negativeExemplars}
            onChange={(e) => setNegativeExemplars(e.target.value)}
            placeholder="e.g., 'not the 12mm socket', 'not silver fob'"
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 placeholder-zinc-600 text-xs focus:outline-none focus:border-amber-400/80"
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

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar font-mono text-xs">
        <span className="text-zinc-500 text-[10px] font-medium whitespace-nowrap">Quick Examples:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            id={`preset-prompt-${idx}`}
            onClick={() => handlePresetSelect(p.text)}
            className="px-3 py-1 rounded-full bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 text-[10px] font-medium transition whitespace-nowrap"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};
