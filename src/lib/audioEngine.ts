// Web Audio API Synthesizer & Web Speech Engine for Warmer "Hot/Cold" Proximity Guidance

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastChimeTime: number = 0;
  private lastSpeechTime: number = 0;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  /**
   * Plays a proximity chime tone.
   * proximityRatio: 0 (cold) to 1 (hot / target centered)
   */
  public playProximityTone(proximityRatio: number) {
    if (this.isMuted) return;
    const now = Date.now();
    
    // Throttle chime intervals based on proximity (hotter = faster chimes)
    const intervalMs = Math.max(120, 800 - proximityRatio * 650);
    if (now - this.lastChimeTime < intervalMs) return;
    this.lastChimeTime = now;

    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Frequency rises as target gets closer (440Hz -> 880Hz -> 1320Hz)
      const freq = 440 + proximityRatio * 880;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Volume envelope
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      // Audio context error ignore
    }
  }

  /**
   * Plays target found success chime chord
   */
  public playFoundChord() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 major chord
    notes.forEach((freq, idx) => {
      try {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.01, this.ctx!.currentTime + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.18, this.ctx!.currentTime + idx * 0.06 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.06 + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.06);
        osc.stop(this.ctx!.currentTime + idx * 0.06 + 0.55);
      } catch (e) {}
    });
  }

  /**
   * Spoken audio navigation guidance with throttle protection
   */
  public speakDirectionalGuidance(cardinalDirection: string, proximityPercent: number) {
    if (this.isMuted) return;
    const now = Date.now();
    if (now - this.lastSpeechTime < 4500) return; // Throttle speech announcements
    this.lastSpeechTime = now;

    let text = `Target in ${cardinalDirection}. ${proximityPercent}% aligned.`;
    if (proximityPercent > 85) {
      text = `Target locked in center.`;
    }

    this.speak(text);
  }

  /**
   * Text To Speech for accessibility guidance
   */
  public speak(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.15;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  }
}

export const audioEngine = new AudioEngine();
