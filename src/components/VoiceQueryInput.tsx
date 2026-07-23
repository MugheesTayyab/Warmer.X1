import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Search, X } from 'lucide-react';
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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showNegative, setShowNegative] = useState(false);

  const triggerQueryParser = async (rawQuery: string) => {
    if (!rawQuery || rawQuery.trim().length < 2) return;
    try {
      const res = await fetch('/api/parse-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: rawQuery }),
      });
      if (res.ok) {
        const data: QueryParseResult = await res.json();
        if (data.negativeConstraints.length > 0 && !negativeExemplars) {
          setNegativeExemplars(data.negativeConstraints.join(', '));
        }
      }
    } catch (err) {
      console.warn('Query parse failed:', err);
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
      if (query) {
        saveRecentSearch(query);
        triggerQueryParser(query);
      }
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

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== term.toLowerCase());
      return [term, ...filtered].slice(0, 4);
    });
  };

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      audioEngine.speak('Listening');
    }
  };

  const handleTriggerScan = () => {
    if (query) {
      saveRecentSearch(query);
      triggerQueryParser(query);
    }
    onAnalyzeTrigger();
  };

  const handleSelectRecent = (recentTerm: string) => {
    setQuery(recentTerm);
    triggerQueryParser(recentTerm);
    onAnalyzeTrigger();
  };

  return (
    <div className="space-y-3 font-sans max-w-4xl mx-auto">
      {/* Search Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#5C5C5A]">
          <Search className="w-5 h-5" strokeWidth={1.5} />
        </div>

        <input
          id="input-target-query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTriggerScan()}
          placeholder={isListening ? 'Listening...' : 'What are you looking for?'}
          className="w-full pl-12 pr-28 py-3.5 bg-[#151517] border border-[rgba(245,245,243,0.08)] rounded-xl text-[#F5F5F3] placeholder-[#5C5C5A] text-base focus:outline-none focus:border-[rgba(245,245,243,0.24)] transition font-normal"
        />

        <div className="absolute inset-y-0 right-2 flex items-center space-x-1.5">
          {/* Mic Button */}
          <button
            id="btn-voice-recording-mic"
            type="button"
            onClick={toggleMic}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${
              isListening
                ? 'bg-[#F5F5F3] text-[#0A0A0B]'
                : 'text-[#A3A3A0] hover:text-[#F5F5F3] hover:bg-[#1f1f23]'
            }`}
            title={isListening ? 'Stop listening' : 'Listen'}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <Mic className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>

          {/* Search Trigger Button */}
          <button
            id="btn-trigger-sam-scan"
            type="button"
            onClick={handleTriggerScan}
            disabled={isAnalyzing}
            className="px-3.5 py-2 rounded-lg bg-[#F5F5F3] text-[#0A0A0B] font-medium text-xs hover:bg-white transition disabled:opacity-50"
          >
            {isAnalyzing ? 'Searching' : 'Search'}
          </button>
        </div>
      </div>

      {/* Exclusions Input Toggle */}
      {showNegative || negativeExemplars ? (
        <div className="flex items-center space-x-2 text-xs text-[#A3A3A0]">
          <span className="text-[#5C5C5A]">Excluding:</span>
          <input
            type="text"
            value={negativeExemplars}
            onChange={(e) => setNegativeExemplars(e.target.value)}
            placeholder="e.g. not the 12mm socket"
            className="flex-1 bg-[#151517] border border-[rgba(245,245,243,0.08)] rounded-lg px-3 py-1 text-[#F5F5F3] placeholder-[#5C5C5A] text-xs focus:outline-none"
          />
          <button onClick={() => setNegativeExemplars('')} className="text-[#5C5C5A] hover:text-[#F5F5F3]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNegative(true)}
          className="text-[11px] text-[#5C5C5A] hover:text-[#A3A3A0] transition"
        >
          + Add exclusion criteria
        </button>
      )}

      {/* Recent Searches Chips (Appears only when user has search history) */}
      {recentSearches.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto text-xs text-[#A3A3A0] pt-1 no-scrollbar">
          <span className="text-[11px] text-[#5C5C5A]">Recent:</span>
          {recentSearches.map((term, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectRecent(term)}
              className="px-3 py-1 rounded-xl bg-[#151517] border border-[rgba(245,245,243,0.08)] text-[#F5F5F3] text-xs hover:border-[rgba(245,245,243,0.24)] transition whitespace-nowrap"
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
