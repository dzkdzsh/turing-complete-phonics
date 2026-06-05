// Wav2vec2ModelLoader —— 通过 esm.sh CDN 懒加载 wav2vec2 ONNX 模型，全局单例
// CDN ESM import 绕过 Next.js Turbopack 打包问题

const ESM_URL = 'https://esm.sh/@xenova/transformers@2.17.2';
const MODEL_ID = 'Xenova/wav2vec2-base-960h';

// 使用 new Function 包裹，防止 Turbopack 处理动态 import
function importFromCDN(url: string): Promise<unknown> {
  return new Function('url', 'return import(url)')(url);
}

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
      onProgress?.(0.05);

      // Step 1: 从 esm.sh CDN 加载 transformers 模块
      const mod = await importFromCDN(ESM_URL) as Record<string, unknown>;

      onProgress?.(0.1);

      const pipelineFn = mod.pipeline as (
        task: string,
        model: string,
        opts?: Record<string, unknown>
      ) => Promise<unknown>;

      if (!pipelineFn) throw new Error('transformers 模块中没有 pipeline 函数');

      // Step 2: 创建 ASR pipeline（自动下载 ONNX 模型，~95MB，3-8 秒）
      const pipe = await pipelineFn(
        'automatic-speech-recognition',
        MODEL_ID,
        {
          progress_callback: (info: { status: string; progress?: number }) => {
            if (info.status === 'progress' && info.progress !== undefined) {
              this._loadProgress = 0.1 + info.progress * 0.85;
              onProgress?.(this._loadProgress);
            } else if (info.status === 'done' || info.status === 'ready') {
              this._loadProgress = 0.95;
              onProgress?.(0.95);
            }
          },
        }
      );

      this._pipeline = pipe;
      this._loaded = true;
      this._loadProgress = 1;
      onProgress?.(1);
      console.log('[Wav2vec2ModelLoader] wav2vec2 模型加载完成');
    } catch (err) {
      this._loadPromise = null;
      this._loaded = false;
      console.warn('[Wav2vec2ModelLoader] 模型加载失败，将回退到 FFT 模式:', err);
      throw err;
    }
  }
}
