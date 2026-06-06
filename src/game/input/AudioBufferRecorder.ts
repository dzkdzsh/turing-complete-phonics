// AudioBufferRecorder —— 累积麦克风音频到 Float32Array 缓冲区

export class AudioBufferRecorder {
  private buffer: Float32Array;
  private writePos = 0;
  private maxSamples: number;
  private _sampleRate: number;

  constructor(maxDurationSec: number, sampleRate: number) {
    this._sampleRate = sampleRate;
    this.maxSamples = Math.ceil(maxDurationSec * sampleRate);
    this.buffer = new Float32Array(this.maxSamples);
  }

  /** 追加一帧音频数据 */
  append(samples: Float32Array): void {
    const remaining = this.maxSamples - this.writePos;
    const toCopy = Math.min(samples.length, remaining);
    this.buffer.set(samples.subarray(0, toCopy), this.writePos);
    this.writePos += toCopy;
  }

  /** 获取完整 buffer（截断到实际写入位置） */
  getData(): Float32Array {
    if (this.writePos >= this.maxSamples) return this.buffer;
    return this.buffer.subarray(0, this.writePos);
  }

  get durationSec(): number {
    return this.writePos / this._sampleRate;
  }

  get sampleRate(): number {
    return this._sampleRate;
  }

  isFull(): boolean {
    return this.writePos >= this.maxSamples;
  }

  isEmpty(): boolean {
    return this.writePos === 0;
  }

  reset(): void {
    this.writePos = 0;
  }
}
