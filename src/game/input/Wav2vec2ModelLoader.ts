// Wav2vec2ModelLoader —— 懒加载 wav2vec2 ONNX 模型，全局单例
// 使用 @xenova/transformers 的 pipeline API
// 模型 ~95MB，首次下载后缓存至浏览器 IndexedDB

import { pipeline } from '@xenova/transformers';
import type { Pipeline } from '@xenova/transformers';

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
  get loadProgress(): number { return this._loadProgress; }
  get loadError(): string | null { return this._loadError; }

  /** 幂等加载：已加载直接返回，加载中等待 */
  async ensureLoaded(onProgress?: (pct: number) => void): Promise<void> {
    if (this._isLoaded) return;

    if (this._isLoading) {
      // 等待正在进行的加载
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
      this._pipeline = await pipeline(
        'automatic-speech-recognition',
        'Xenova/wav2vec2-base-960h',
        {
          progress_callback: (info: { status: string; progress?: number }) => {
            if (info.status === 'progress' && info.progress) {
              this._loadProgress = info.progress / 100;
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
