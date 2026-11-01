import { AppState, UpscaleImage } from './types';

type Listener = () => void;

class Store {
  private state: AppState = {
    images: [],
    activeImageId: null,
    selectedModelId: 'upscayl-standard',
    scaleMultiplier: 4,
    tileSize: 256,
    isProcessing: false,
    progressMessage: '',
    splitPosition: 50,
    device: 'wasm',
    drawerOpen: false,
  };

  private listeners: Set<Listener> = new Set();

  getState(): AppState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  setDevice(device: AppState['device']): void {
    this.state = { ...this.state, device };
    this.notify();
  }

  setSelectedModel(selectedModelId: string): void {
    this.state = { ...this.state, selectedModelId };
    this.notify();
  }

  setScaleMultiplier(scaleMultiplier: number): void {
    this.state = { ...this.state, scaleMultiplier };
    this.notify();
  }

  setTileSize(tileSize: number): void {
    this.state = { ...this.state, tileSize };
    this.notify();
  }

  setSplitPosition(splitPosition: number): void {
    this.state = { ...this.state, splitPosition };
    this.notify();
  }

  setDrawerOpen(drawerOpen: boolean): void {
    this.state = { ...this.state, drawerOpen };
    this.notify();
  }

  setProcessing(isProcessing: boolean, progressMessage = ''): void {
    this.state = {
      ...this.state,
      isProcessing,
      progressMessage,
    };
    this.notify();
  }

  setProgressMessage(progressMessage: string): void {
    this.state = { ...this.state, progressMessage };
    this.notify();
  }

  addImages(newImages: UpscaleImage[]): void {
    const images = [...this.state.images, ...newImages];
    const activeImageId = this.state.activeImageId ?? (newImages[0]?.id || null);
    this.state = { ...this.state, images, activeImageId };
    this.notify();
  }

  removeImage(id: string): void {
    const images = this.state.images.filter((img) => img.id !== id);
    let activeImageId = this.state.activeImageId;
    if (activeImageId === id) {
      activeImageId = images.length > 0 ? images[0].id : null;
    }
    this.state = { ...this.state, images, activeImageId };
    this.notify();
  }

  clearImages(): void {
    this.state = { ...this.state, images: [], activeImageId: null };
    this.notify();
  }

  setActiveImage(id: string): void {
    this.state = { ...this.state, activeImageId: id, splitPosition: 50 };
    this.notify();
  }

  setImageUpscaled(id: string, canvas: HTMLCanvasElement, sizeBytes?: number): void {
    const images = this.state.images.map((img) => {
      if (img.id === id) {
        return {
          ...img,
          upscaledCanvas: canvas,
          upscaledWidth: canvas.width,
          upscaledHeight: canvas.height,
          upscaledSizeBytes: sizeBytes,
        };
      }
      return img;
    });
    this.state = { ...this.state, images, splitPosition: 50 };
    this.notify();
  }
}

export const store = new Store();
