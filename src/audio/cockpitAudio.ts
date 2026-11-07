/**
 * Procedural Web Audio synthesizer for Boeing 737-800 flight deck.
 * Generates realistic CFM56 engine sounds, avionics fans, mechanical switch clicks,
 * gear lever clunks, Boeing 737 cabin chimes, and master caution alerts.
 * Zero external audio files (guaranteed 100% offline & zero 404s).
 */

class CockpitAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Continuous sound nodes
  private avionicsGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engineWhineOsc1: OscillatorNode | null = null;
  private engineWhineOsc2: OscillatorNode | null = null;
  private engineNoiseFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startContinuousSounds();
    } catch {
      // AudioContext may be blocked until user gesture
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number) {
    if (!this.masterGain || !this.ctx) return;
    const v = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : v, this.ctx.currentTime, 0.05);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.05);
    }
  }

  private startContinuousSounds() {
    if (!this.ctx || !this.masterGain) return;

    // 1. Cockpit Avionics Cooling Fan Hum (Gentle continuous white/pink noise + low 400Hz transformer drone)
    const avionicsBus = this.ctx.createGain();
    avionicsBus.gain.setValueAtTime(0.04, this.ctx.currentTime);
    avionicsBus.connect(this.masterGain);
    this.avionicsGain = avionicsBus;

    // 400Hz Boeing avionics AC power hum
    const humOsc = this.ctx.createOscillator();
    humOsc.type = 'sine';
    humOsc.frequency.setValueAtTime(400, this.ctx.currentTime);
    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
    humOsc.connect(humGain);
    humGain.connect(avionicsBus);
    humOsc.start();

    // Fan air flow noise
    const fanNoiseBuffer = this.createNoiseBuffer(2);
    const fanNoise = this.ctx.createBufferSource();
    fanNoise.buffer = fanNoiseBuffer;
    fanNoise.loop = true;
    const fanFilter = this.ctx.createBiquadFilter();
    fanFilter.type = 'bandpass';
    fanFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    fanFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);
    fanNoise.connect(fanFilter);
    fanFilter.connect(avionicsBus);
    fanNoise.start();

    // 2. CFM56-7B Turbofan Engine Sound (Sub-bass rumble + compressor spool whine)
    const engineBus = this.ctx.createGain();
    engineBus.gain.setValueAtTime(0.0, this.ctx.currentTime);
    engineBus.connect(this.masterGain);
    this.engineGain = engineBus;

    // Engine rumble noise
    const engineNoiseSource = this.ctx.createBufferSource();
    engineNoiseSource.buffer = this.createNoiseBuffer(3);
    engineNoiseSource.loop = true;
    this.engineNoiseFilter = this.ctx.createBiquadFilter();
    this.engineNoiseFilter.type = 'lowpass';
    this.engineNoiseFilter.frequency.setValueAtTime(180, this.ctx.currentTime);
    engineNoiseSource.connect(this.engineNoiseFilter);
    this.engineNoiseFilter.connect(engineBus);
    engineNoiseSource.start();

    // Engine spool fan blade whine 1 (N1 proportional)
    this.engineWhineOsc1 = this.ctx.createOscillator();
    this.engineWhineOsc1.type = 'triangle';
    this.engineWhineOsc1.frequency.setValueAtTime(250, this.ctx.currentTime);
    const whine1Gain = this.ctx.createGain();
    whine1Gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    this.engineWhineOsc1.connect(whine1Gain);
    whine1Gain.connect(engineBus);
    this.engineWhineOsc1.start();

    // Engine spool whine 2 (high harmonic buzz)
    this.engineWhineOsc2 = this.ctx.createOscillator();
    this.engineWhineOsc2.type = 'sawtooth';
    this.engineWhineOsc2.frequency.setValueAtTime(500, this.ctx.currentTime);
    const whine2Filter = this.ctx.createBiquadFilter();
    whine2Filter.type = 'lowpass';
    whine2Filter.frequency.setValueAtTime(900, this.ctx.currentTime);
    const whine2Gain = this.ctx.createGain();
    whine2Gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
    this.engineWhineOsc2.connect(whine2Filter);
    whine2Filter.connect(whine2Gain);
    whine2Gain.connect(engineBus);
    this.engineWhineOsc2.start();

    // 3. Rain Sound (for Storm mode)
    const rainBus = this.ctx.createGain();
    rainBus.gain.setValueAtTime(0.0, this.ctx.currentTime);
    rainBus.connect(this.masterGain);
    this.rainGain = rainBus;

    const rainNoiseSource = this.ctx.createBufferSource();
    rainNoiseSource.buffer = this.createNoiseBuffer(2);
    rainNoiseSource.loop = true;
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);
    rainFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);
    rainNoiseSource.connect(rainFilter);
    rainFilter.connect(rainBus);
    rainNoiseSource.start();
  }

  private createNoiseBuffer(seconds: number): AudioBuffer {
    if (!this.ctx) throw new Error('No audio context');
    const sampleRate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, sampleRate * seconds, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Update engine sound based on throttle / N1 percentage (0 to 104%)
   */
  public updateEngines(n1Average: number, running: boolean, isStorm: boolean) {
    if (!this.ctx || !this.engineGain || !this.engineNoiseFilter) return;

    if (!running || n1Average < 5) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      return;
    }

    // Engine volume scales with N1
    const targetGain = 0.08 + (n1Average / 100) * 0.28;
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);

    // Filter frequency opens up with thrust
    const cutoffFreq = 160 + (n1Average / 100) * 450;
    this.engineNoiseFilter.frequency.setTargetAtTime(cutoffFreq, this.ctx.currentTime, 0.1);

    // Whine frequency shifts with spool RPM (200Hz idle to 1100Hz max thrust)
    const whineFreq1 = 180 + Math.pow(n1Average / 100, 1.4) * 850;
    const whineFreq2 = whineFreq1 * 2.1;
    if (this.engineWhineOsc1) {
      this.engineWhineOsc1.frequency.setTargetAtTime(whineFreq1, this.ctx.currentTime, 0.1);
    }
    if (this.engineWhineOsc2) {
      this.engineWhineOsc2.frequency.setTargetAtTime(whineFreq2, this.ctx.currentTime, 0.1);
    }

    // Rain volume
    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(isStorm ? 0.12 : 0, this.ctx.currentTime, 0.3);
    }
  }

  /**
   * Play crisp mechanical toggle switch snap sound
   */
  public playSwitchClick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.025);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.Q.setValueAtTime(2.5, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  /**
   * Play heavy mechanical clunk sound (Gear lever, Flap gate, Parking brake)
   */
  public playHeavyClunk() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Initial sharp metallic thud
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(320, t);
    osc1.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    gain1.gain.setValueAtTime(0.35, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.15);

    // Mechanical spring rattle
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(950, t + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(120, t + 0.08);
    gain2.gain.setValueAtTime(0.15, t + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.02);
    osc2.stop(t + 0.1);
  }

  /**
   * Play rotary knob click / ratcheting tick
   */
  public playKnobTick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(2200, t);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.015);
  }

  /**
   * Authentic Boeing 737 passenger cabin chime ("Ding-Dong" dual tone)
   */
  public playCabinChime() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;

    // Tone 1: High bell (~660Hz E5)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, t);
    gain1.gain.setValueAtTime(0.22, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 1.0);

    // Tone 2: Lower bell (~554Hz C#5) triggered 0.18s later
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(554.37, t + 0.18);
    gain2.gain.setValueAtTime(0.25, t + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 1.3);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.18);
    osc2.stop(t + 1.4);
  }

  /**
   * Master Caution Alert beep
   */
  public playMasterCautionBeep() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  /**
   * Distant Thunder rumble for Storm mode
   */
  public playThunder() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(2.5);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(80, t);
    filter.frequency.exponentialRampToValueAtTime(220, t + 0.4);
    filter.frequency.exponentialRampToValueAtTime(50, t + 2.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 2.5);
  }
}

export const cockpitAudio = new CockpitAudioEngine();
