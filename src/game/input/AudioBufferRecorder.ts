// AudioBufferRecorder —— 累积麦克风音频数据到 Float32Array 缓冲区

export class AudioBufferRecorder {
  private buffer: Float32Array;
  private writePos = 0;
  private readonly maxSamples: number;

  constructor(maxDurationSec: number, sampleRate: number) {
    this.maxSamples = Math.floor(maxDurationSec * sampleRate);
    this.buffer = new Float32Array(this.maxSamples);
  }

  append(samples: Float32Array): void {
    const remaining = this.maxSamples - this.writePos;
    const toCopy = Math.min(samples.length, remaining);
    this.buffer.set(samples.subarray(0, toCopy), this.writePos);
    this.writePos += toCopy;
  }

  getData(): Float32Array {
    return this.buffer.subarray(0, this.writePos);
  }

  get durationSec(): number {
    return this.writePos / this.buffer.length * (this.maxSamples / 44100);
  }

  isFull(): boolean {
    return this.writePos >= this.maxSamples;
  }

  get progress(): number {
    return this.writePos / this.maxSamples;
  }

  reset(): void {
    this.writePos = 0;
  }
}
