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
  url: string;
  bytes: number;
}

export interface AppState {
  images: UpscaleImage[];
  activeImageId: string | null;
  selectedModelId: string;
  tileSize: number;
  isProcessing: boolean;
  progressMessage: string;
  splitPosition: number;
  device: ExecutionDevice;
  drawerOpen: boolean;
}
