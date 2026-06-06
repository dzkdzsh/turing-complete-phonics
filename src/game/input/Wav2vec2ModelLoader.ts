// Wav2vec2ModelLoader —— 懒加载 wav2vec2 ONNX 模型，全局单例
// 模型通过 jsdelivr CDN <script> 标签加载，挂载为 window.Transformers
// 模型 ~95MB，首次下载后缓存至浏览器 IndexedDB
// CDN script: https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pipeline = any;

declare global {
  interface Window {
    Transformers?: {
      pipeline: (task: string, model: string, opts?: Record<string, unknown>) => Promise<Pipeline>;
    };
  }
}

/** 等待 CDN 脚本加载完成 */
function waitForTransformers(timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Transformers) { resolve(); return; }
    const start = Date.now();
    const check = setInterval(() => {
      if (window.Transformers) { clearInterval(check); resolve(); return; }
      if (Date.now() - start > timeoutMs) { clearInterval(check); reject(new Error('Transformers CDN load timeout')); }
    }, 100);
  });
}

export class Wav2vec2ModelLoader {
  private static instance: Wav2vec2ModelLoader;

  private _pipeline: Pipeline | null = null;
  private _loadProgress = 0;
  private _isLoaded = false;
  private _isLoading = false;
  private _loadError: string | null = null;

  static getInstance(): Wav2vec2ModelLoader {
    if (!Wav2vec2ModelLoader.instance) {
      Wav2vec2ModelLoader.instance = new Wav2vec2ModelLoader();
    }
    return Wav2vec2ModelLoader.instance;
  }

  get pipeline(): Pipeline | null { return this._pipeline; }
  get isLoaded(): boolean { return this._isLoaded; }
  get isLoading(): boolean { return this._isLoading; }
  get loadProgress(): number { return this._loadProgress; }
  get loadError(): string | null { return this._loadError; }

  /** 取消加载，回退到 FFT 模式 */
  cancel(): void {
    this._loadError = 'User cancelled';
    this._isLoading = false;
    this._loadProgress = 0;
  }

  /** 幂等加载：等待 CDN 脚本就绪 → 创建 pipeline → 下载模型 */
  async ensureLoaded(onProgress?: (pct: number) => void): Promise<void> {
    if (this._isLoaded) return;

    if (this._isLoading) {
      return new Promise((resolve, reject) => {
        const check = setInterval(() => {
          if (this._isLoaded) { clearInterval(check); resolve(); }
          if (this._loadError) { clearInterval(check); reject(new Error(this._loadError!)); }
        }, 200);
      });
    }

    this._isLoading = true;
    this._loadError = null;

    try {
      // Step 1: 等待 CDN 脚本加载
      onProgress?.(0.05);
      await waitForTransformers();

      // Step 2: 创建 pipeline（触发模型下载）
      onProgress?.(0.1);
      this._pipeline = await window.Transformers!.pipeline(
        'automatic-speech-recognition',
        'Xenova/wav2vec2-base-960h',
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          progress_callback: (info: any) => {
            if (info.status === 'progress' && typeof info.progress === 'number') {
              this._loadProgress = 0.1 + (info.progress / 100) * 0.9;
              onProgress?.(this._loadProgress);
            }
          },
        }
      );
      this._isLoaded = true;
      this._loadProgress = 1;
      onProgress?.(1);
    } catch (err) {
      this._loadError = err instanceof Error ? err.message : 'Unknown error loading model';
      throw err;
    } finally {
      this._isLoading = false;
    }
  }

  /** 获取底层 ONNX 模型（用于直接调用获得 logits） */
  get model(): unknown | null {
    return (this._pipeline as unknown as { model?: unknown })?.model ?? null;
  }

  /** 获取 processor / feature extractor */
  get processor(): unknown | null {
    return (this._pipeline as unknown as { processor?: unknown })?.processor ?? null;
  }
}
