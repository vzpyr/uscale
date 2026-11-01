import { store } from '../state/store';
import { el } from '../utils/dom';
import { OFFICIAL_UPSCAYL_MODELS } from '../engine/models';
import { upscaleImageAsync } from '../engine/session';

export function createModel(): HTMLElement {
  const panel = el('div', 'panel-bottom');

  const header = el('div', 'panel-header');
  const title = el('span', 'panel-header-title', 'model');
  header.appendChild(title);

  const body = el('div', 'panel-body');

  const select = el('select', 'select-input') as HTMLSelectElement;
  for (const model of OFFICIAL_UPSCAYL_MODELS) {
    const opt = el('option');
    opt.value = model.id;
    opt.textContent = `${model.id} (${model.sizeDisplay})`;
    select.appendChild(opt);
  }

  select.addEventListener('change', () => {
    store.setSelectedModel(select.value);
  });

  const scaleRow = el('div', 'btn-group');
  const scaleButtons: { mult: number; btn: HTMLButtonElement }[] = [
    { mult: 2, btn: el('button', 'btn-segmented', '2x') as HTMLButtonElement },
    { mult: 3, btn: el('button', 'btn-segmented', '3x') as HTMLButtonElement },
    { mult: 4, btn: el('button', 'btn-segmented', '4x') as HTMLButtonElement },
  ];

  scaleButtons.forEach(({ mult, btn }) => {
    btn.addEventListener('click', () => store.setScaleMultiplier(mult));
    scaleRow.appendChild(btn);
  });

  const tileRow = el('div', 'btn-group');
  const tileButtons: { size: number; label: string; btn: HTMLButtonElement }[] = [
    { size: 128, label: '128', btn: el('button', 'btn-segmented', '128') as HTMLButtonElement },
    { size: 256, label: '256', btn: el('button', 'btn-segmented', '256') as HTMLButtonElement },
    { size: 384, label: '384', btn: el('button', 'btn-segmented', '384') as HTMLButtonElement },
    { size: 512, label: '512', btn: el('button', 'btn-segmented', '512') as HTMLButtonElement },
  ];

  tileButtons.forEach(({ size, btn }) => {
    btn.addEventListener('click', () => store.setTileSize(size));
    tileRow.appendChild(btn);
  });

  const backendRow = el('div', 'btn-group');
  const webgpuBtn = el('button', 'btn-segmented', 'webgpu');
  const wasmBtn = el('button', 'btn-segmented', 'wasm');

  webgpuBtn.addEventListener('click', () => store.setDevice('webgpu'));
  wasmBtn.addEventListener('click', () => store.setDevice('wasm'));

  backendRow.appendChild(webgpuBtn);
  backendRow.appendChild(wasmBtn);

  const statusBox = el('div', 'status-badge');
  const indicator = el('div', 'status-indicator');
  const statusText = el('span', '', 'idle');
  statusBox.appendChild(indicator);
  statusBox.appendChild(statusText);

  const actionRow = el('div', 'btn-group');
  const upscaleBtn = el('button', 'btn-primary', 'upscale');
  upscaleBtn.addEventListener('click', runUpscaleSingle);

  const upscaleAllBtn = el('button', '', 'upscale all');
  upscaleAllBtn.addEventListener('click', runUpscaleAll);

  actionRow.appendChild(upscaleBtn);
  actionRow.appendChild(upscaleAllBtn);

  body.appendChild(select);
  body.appendChild(scaleRow);
  body.appendChild(tileRow);
  body.appendChild(backendRow);
  body.appendChild(statusBox);
  body.appendChild(actionRow);

  panel.appendChild(header);
  panel.appendChild(body);

  async function processImage(img: any, prefix = '') {
    const { selectedModelId, device, scaleMultiplier, tileSize } = store.getState();
    const model = OFFICIAL_UPSCAYL_MODELS.find((m) => m.id === selectedModelId);
    if (!model) return;

    const { canvas, sizeBytes } = await upscaleImageAsync({
      model,
      device: device === 'webgpu' ? 'webgpu' : 'wasm',
      tileSize,
      bitmap: img.originalBitmap,
      scaleMultiplier,
      onProgress: (msg) => {
        store.setProgressMessage(prefix ? `${prefix} • ${msg}` : msg);
      },
    });

    store.setImageUpscaled(img.id, canvas, sizeBytes);
  }

  async function runUpscaleSingle() {
    const { images, activeImageId } = store.getState();
    const activeImage = images.find((i) => i.id === activeImageId);
    if (!activeImage || activeImage.upscaledCanvas) return;

    store.setProcessing(true, 'starting...');

    try {
      await processImage(activeImage);
      store.setProcessing(false, 'done');
    } catch (err: any) {
      console.error(err);
      store.setProcessing(false, `error: ${err?.message || 'failed'}`);
    }
  }

  async function runUpscaleAll() {
    const { images } = store.getState();
    const pendingImages = images.filter((img) => !img.upscaledCanvas);
    if (pendingImages.length === 0) return;

    store.setProcessing(true, 'starting...');

    try {
      for (let idx = 0; idx < pendingImages.length; idx++) {
        const img = pendingImages[idx];
        const prefix = `image ${idx + 1}/${pendingImages.length}`;
        await processImage(img, prefix);
      }
      store.setProcessing(false, 'done');
    } catch (err: any) {
      console.error(err);
      store.setProcessing(false, `error: ${err?.message || 'failed'}`);
    }
  }

  const onStateChange = () => {
    const {
      isProcessing,
      progressMessage,
      selectedModelId,
      scaleMultiplier,
      tileSize,
      images,
      activeImageId,
      device,
    } = store.getState();
    const activeImage = images.find((i) => i.id === activeImageId);
    const hasUnupscaledActive = !!activeImage && !activeImage.upscaledCanvas;

    const totalImages = images.length;
    const unupscaledCount = images.filter((img) => !img.upscaledCanvas).length;
    const canUpscaleAll = totalImages > 1 && unupscaledCount > 0;

    select.value = selectedModelId;
    select.disabled = isProcessing;

    scaleButtons.forEach(({ mult, btn }) => {
      btn.disabled = isProcessing;
      btn.classList.toggle('active', scaleMultiplier === mult);
    });

    tileButtons.forEach(({ size, btn }) => {
      btn.disabled = isProcessing;
      btn.classList.toggle('active', tileSize === size);
    });

    upscaleBtn.disabled = isProcessing || !hasUnupscaledActive;
    upscaleAllBtn.disabled = isProcessing || !canUpscaleAll;

    webgpuBtn.disabled = isProcessing;
    wasmBtn.disabled = isProcessing;

    webgpuBtn.classList.toggle('active', device === 'webgpu');
    wasmBtn.classList.toggle('active', device === 'wasm');

    indicator.className = 'status-indicator';
    if (isProcessing) {
      indicator.classList.add('running');
      statusText.textContent = progressMessage;
    } else if (progressMessage.startsWith('error')) {
      indicator.classList.add('error');
      statusText.textContent = progressMessage;
    } else {
      indicator.classList.add('ready');
      statusText.textContent = progressMessage || 'idle';
    }
  };

  store.subscribe(onStateChange);
  onStateChange();

  return panel;
}
