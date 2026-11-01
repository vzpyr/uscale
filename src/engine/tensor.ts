import * as ort from 'onnxruntime-web/webgpu';

export function bitmapToFloatTensor(
  source: ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number
): ort.Tensor {
  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(cropW, cropH)
      : document.createElement('canvas');
  canvas.width = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null;
  if (!ctx) {
    throw new Error('failed to create canvas 2d context');
  }

  ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  const { data } = ctx.getImageData(0, 0, cropW, cropH);

  const float32 = new Float32Array(3 * cropW * cropH);
  const planeSize = cropW * cropH;

  for (let i = 0; i < planeSize; i++) {
    float32[i] = data[i * 4] / 255.0;
    float32[planeSize + i] = data[i * 4 + 1] / 255.0;
    float32[planeSize * 2 + i] = data[i * 4 + 2] / 255.0;
  }

  return new ort.Tensor('float32', float32, [1, 3, cropH, cropW]);
}

export function floatTensorToCanvas(
  tensor: ort.Tensor,
  targetCanvas: OffscreenCanvas | HTMLCanvasElement,
  destX: number,
  destY: number
): void {
  const [, , height, width] = tensor.dims;
  const data = tensor.data as Float32Array;

  const tileCanvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : document.createElement('canvas');
  tileCanvas.width = width;
  tileCanvas.height = height;
  const tileCtx = tileCanvas.getContext('2d') as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null;
  if (!tileCtx) return;

  const imgData = tileCtx.createImageData(width, height);
  const planeSize = width * height;

  for (let i = 0; i < planeSize; i++) {
    const r = Math.min(255, Math.max(0, Math.round(data[i] * 255)));
    const g = Math.min(255, Math.max(0, Math.round(data[planeSize + i] * 255)));
    const b = Math.min(255, Math.max(0, Math.round(data[planeSize * 2 + i] * 255)));

    const idx = i * 4;
    imgData.data[idx] = r;
    imgData.data[idx + 1] = g;
    imgData.data[idx + 2] = b;
    imgData.data[idx + 3] = 255;
  }

  tileCtx.putImageData(imgData, 0, 0);

  const targetCtx = targetCanvas.getContext('2d') as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null;
  if (targetCtx) {
    targetCtx.drawImage(tileCanvas, destX, destY);
  }
}
