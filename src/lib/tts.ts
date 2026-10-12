/**
 * Smart TTS Voice Engine utilizing the browser Web Speech API (window.speechSynthesis)
 * and Web Audio API for audio chimes.
 */

class TTSEngine {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prefer clear, modern voices (Google US English, Samantha, Daniel, Alex)
    const preferred = voices.find(
      (v) =>
        (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Enhanced'))) ||
        v.lang === 'en-US'
    );
    this.voice = preferred || voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val && this.synth) {
      this.synth.cancel();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public playTone(frequency: number = 880, durationMs: number = 200, type: OscillatorType = 'sine') {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
      // Ignore audio context autoplay restriction errors
    }
  }

  public speak(text: string, rate: number = 1.05, pitch: number = 1.0) {
    if (!this.enabled || !this.synth) return;
    try {
      this.synth.cancel(); // Stop overlapping speech
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) {
        utterance.voice = this.voice;
      }
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1.0;
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
    }
  }

  public announceTenSecondsLeft() {
    this.playTone(660, 150);
    this.speak('10 seconds left, get in position', 1.1, 1.05);
  }

  public announceTimeIsUp() {
    this.playTone(980, 300);
    setTimeout(() => {
      this.playTone(1320, 400);
    }, 120);
    this.speak('Time is up, start your set.', 1.1, 1.05);
  }

  public testVoice() {
    this.playTone(880, 200);
    this.speak('VITA Smart Voice Coach active. Ready for your sets.', 1.05, 1.0);
  }
}

export const tts = new TTSEngine();
