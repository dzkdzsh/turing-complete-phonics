// MicrophoneInput —— getUserMedia 麦克风捕获

import { eventBus } from '../event-bus';
import { GameEvents } from '@/types/events';

export class MicrophoneInput {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private isActive = false;
  private animationFrame = 0;
  private onDataCallback: ((freq: Uint8Array, time: Float32Array) => void) | null = null;

  async start(): Promise<void> {
    if (this.isActive) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.ctx = new AudioContext({ sampleRate: 44100 });
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.3;

      const source = this.ctx.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      this.isActive = true;
      eventBus.emit(GameEvents.MIC_STATUS_CHANGED, { status: 'listening' });

      console.log('[MicrophoneInput] 麦克风已启动');
    } catch (err) {
      console.error('[MicrophoneInput] 启动失败:', err);
      eventBus.emit(GameEvents.MIC_STATUS_CHANGED, { status: 'error' });
      throw err;
    }
  }

  stop() {
    this.isActive = false;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }

    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }

    this.analyser = null;
    eventBus.emit(GameEvents.MIC_STATUS_CHANGED, { status: 'idle' });
    console.log('[MicrophoneInput] 麦克风已停止');
  }

  /** 开始持续读取数据 */
  startListening(callback: (freq: Uint8Array, time: Float32Array) => void) {
    this.onDataCallback = callback;
    this.pollData();
  }

  private pollData() {
    if (!this.isActive || !this.analyser) return;

    const freqData = new Uint8Array(this.analyser.frequencyBinCount);
    const timeData = new Float32Array(this.analyser.fftSize);

    this.analyser.getByteFrequencyData(freqData);
    this.analyser.getFloatTimeDomainData(timeData);

    if (this.onDataCallback) {
      this.onDataCallback(freqData, timeData);
    }

    this.animationFrame = requestAnimationFrame(() => this.pollData());
  }

  /** 检测当前是否静音 */
  isSilent(threshold = 0.01): boolean {
    if (!this.analyser) return true;

    const timeData = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(timeData);

    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      sum += timeData[i] * timeData[i];
    }
    const rms = Math.sqrt(sum / timeData.length);
    return rms < threshold;
  }
}
