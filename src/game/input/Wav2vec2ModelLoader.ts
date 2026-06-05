// Wav2vec2ModelLoader —— 懒加载 wav2vec2 ONNX 模型，全局单例

export class Wav2vec2ModelLoader {
  private static instance: Wav2vec2ModelLoader;
  private _pipeline: unknown = null;
  private _loaded = false;
  private _loadProgress = 0;
  private _loadPromise: Promise<void> | null = null;

  static getInstance(): Wav2vec2ModelLoader {
    if (!Wav2vec2ModelLoader.instance) {
      Wav2vec2ModelLoader.instance = new Wav2vec2ModelLoader();
    }
    return Wav2vec2ModelLoader.instance;
  }

  get isLoaded(): boolean { return this._loaded; }
  get loadProgress(): number { return this._loadProgress; }
  get pipeline(): unknown { return this._pipeline; }

  async ensureLoaded(onProgress?: (pct: number) => void): Promise<void> {
    if (this._loaded) return;
    if (this._loadPromise) return this._loadPromise;

    this._loadPromise = this._doLoad(onProgress);
    return this._loadPromise;
  }

  private async _doLoad(onProgress?: (pct: number) => void): Promise<void> {
    try {
      const { pipeline } = await import('@xenova/transformers');

      // 使用 ASR pipeline，加载 wav2vec2-base-960h
      const pipe = await pipeline(
        'automatic-speech-recognition',
        'Xenova/wav2vec2-base-960h',
        {
          progress_callback: (info: { status: string; progress?: number }) => {
            if (info.status === 'progress' && info.progress !== undefined) {
              this._loadProgress = info.progress / 100;
              onProgress?.(this._loadProgress);
            } else if (info.status === 'done') {
              this._loadProgress = 1;
              onProgress?.(1);
            }
          },
        }
      );

      this._pipeline = pipe;
      this._loaded = true;
      this._loadProgress = 1;
      onProgress?.(1);
      console.log('[Wav2vec2ModelLoader] 模型加载完成');
    } catch (err) {
      this._loadPromise = null;
      console.warn('[Wav2vec2ModelLoader] 模型加载失败，将回退到 FFT 模式:', err);
      throw err;
    }
  }
}
