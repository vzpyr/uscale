import { UpscaleModelDef } from '../state/types';

let worker: Worker | null = null;
let currentRequestId = 0;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  }
  return worker;
}

export interface UpscaleJobOptions {
  model: UpscaleModelDef;
  device: 'webgpu' | 'wasm';
  tileSize: number;
  bitmap: ImageBitmap;
  scaleMultiplier: number;
  onProgress: (message: string) => void;
}

export function upscaleImageAsync(
  options: UpscaleJobOptions
): Promise<{ canvas: HTMLCanvasElement; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    const workerInstance = getWorker();
    const id = ++currentRequestId;

    const handler = (e: MessageEvent) => {
      if (e.data?.id !== id) return;

      if (e.data.type === 'progress') {
        options.onProgress(e.data.message);
      } else if (e.data.type === 'complete') {
        workerInstance.removeEventListener('message', handler);
        const { bitmap, sizeBytes } = e.data;
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        resolve({ canvas, sizeBytes });
      } else if (e.data.type === 'error') {
        workerInstance.removeEventListener('message', handler);
        reject(new Error(e.data.error));
      }
    };

    workerInstance.addEventListener('message', handler);

    createImageBitmap(options.bitmap).then((clonedBitmap) => {
      workerInstance.postMessage(
        {
          id,
          type: 'upscale',
          model: options.model,
          device: options.device,
          tileSize: options.tileSize,
          scaleMultiplier: options.scaleMultiplier,
          bitmap: clonedBitmap,
        },
        [clonedBitmap]
      );
    });
  });
}
