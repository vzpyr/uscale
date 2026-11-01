import * as ort from 'onnxruntime-web/webgpu';
import { UpscaleModelDef } from '../state/types';
import { fetchModelBuffer } from './cache';
import { computeAdaptiveTiles } from './tiler';
import { bitmapToFloatTensor, floatTensorToCanvas } from './tensor';

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/';
ort.env.wasm.numThreads = Math.min(8, navigator.hardwareConcurrency || 4);
ort.env.wasm.simd = true;

const sessionCache = new Map<string, ort.InferenceSession>();

async function getInferenceSession(
  model: UpscaleModelDef,
  device: 'webgpu' | 'wasm',
  onProgress: (pct: number) => void
): Promise<ort.InferenceSession> {
  const cacheKey = `${model.id}:${device}`;
  const existing = sessionCache.get(cacheKey);
  if (existing) return existing;

  const buffer = await fetchModelBuffer(model.repo, model.fileName, (rec, tot) => {
    if (tot > 0) onProgress(Math.round((rec / tot) * 100));
  });

  const executionProviders = device === 'webgpu' ? ['webgpu', 'wasm'] : ['wasm'];
  const session = await ort.InferenceSession.create(buffer, {
    executionProviders,
    graphOptimizationLevel: 'all',
  });

  sessionCache.set(cacheKey, session);
  return session;
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, model, device, tileSize, bitmap, scaleMultiplier } = e.data;
  if (type !== 'upscale') return;

  try {
    const session = await getInferenceSession(model, device, (pct) => {
      self.postMessage({ id, type: 'progress', message: `downloading ${pct}%` });
    });

    self.postMessage({ id, type: 'progress', message: `initializing (${device})...` });

    const width = bitmap.width;
    const height = bitmap.height;
    const modelScale = model.scale;

    const targetCanvas = new OffscreenCanvas(width * modelScale, height * modelScale);
    const tiles = computeAdaptiveTiles(width, height, tileSize);

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      self.postMessage({
        id,
        type: 'progress',
        message: `tile ${i + 1}/${tiles.length} (${device})`,
      });

      const inputTensor = bitmapToFloatTensor(bitmap, tile.x, tile.y, tile.width, tile.height);
      const feeds: Record<string, any> = {};
      feeds[session.inputNames[0]] = inputTensor;

      const results = await session.run(feeds);
      const outputTensor = results[session.outputNames[0]];

      floatTensorToCanvas(outputTensor, targetCanvas, tile.x * modelScale, tile.y * modelScale);
    }

    bitmap.close();

    let finalCanvas = targetCanvas;
    if (scaleMultiplier !== modelScale) {
      const rescaledCanvas = new OffscreenCanvas(
        Math.round(width * scaleMultiplier),
        Math.round(height * scaleMultiplier)
      );
      const ctx = rescaledCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(targetCanvas, 0, 0, rescaledCanvas.width, rescaledCanvas.height);
        finalCanvas = rescaledCanvas;
      }
    }

    const blob = await finalCanvas.convertToBlob({ type: 'image/png' });
    const outputBitmap = await createImageBitmap(blob);

    self.postMessage(
      {
        id,
        type: 'complete',
        bitmap: outputBitmap,
        sizeBytes: blob.size,
      },
      [outputBitmap]
    );
  } catch (err: any) {
    self.postMessage({ id, type: 'error', error: err?.message || 'upscale failed' });
  }
};
