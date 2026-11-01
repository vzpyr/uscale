export interface UpscaleImage {
  id: string;
  name: string;
  sizeBytes: number;
  width: number;
  height: number;
  originalBitmap: ImageBitmap;
  originalUrl: string;
  upscaledCanvas?: HTMLCanvasElement;
  upscaledWidth?: number;
  upscaledHeight?: number;
  upscaledSizeBytes?: number;
}

export type ExecutionDevice = 'webgpu' | 'wasm';

export interface UpscaleModelDef {
  id: string;
  scale: number;
  sizeDisplay: string;
  fileName: string;
  repo: string;
}

export interface AppState {
  images: UpscaleImage[];
  activeImageId: string | null;
  selectedModelId: string;
  scaleMultiplier: number;
  tileSize: number;
  isProcessing: boolean;
  progressMessage: string;
  splitPosition: number;
  device: ExecutionDevice;
  drawerOpen: boolean;
}
