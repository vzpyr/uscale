import { store } from '../state/store';
import { el } from '../utils/dom';
import { createFileBitmap, formatBytes } from '../utils/image';

export function createQueue(): HTMLElement {
  const panel = el('div', 'panel-top');

  const header = el('div', 'panel-header');
  const title = el('span', 'panel-header-title', 'queue');

  const headerActions = el('div', 'panel-header-actions');
  const downloadAllBtn = el('button', '', 'download all');
  const clearBtn = el('button', '', 'clear');

  downloadAllBtn.addEventListener('click', () => {
    const { images } = store.getState();
    const upscaled = images.filter((img) => img.upscaledCanvas);
    upscaled.forEach((img, i) => {
      setTimeout(() => {
        if (!img.upscaledCanvas) return;
        const a = document.createElement('a');
        const dotIdx = img.name.lastIndexOf('.');
        const base = dotIdx !== -1 ? img.name.slice(0, dotIdx) : img.name;
        a.download = `${base}_upscaled.png`;
        a.href = img.upscaledCanvas.toDataURL('image/png');
        a.click();
      }, i * 150);
    });
  });

  clearBtn.addEventListener('click', () => store.clearImages());

  headerActions.appendChild(downloadAllBtn);
  headerActions.appendChild(clearBtn);

  header.appendChild(title);
  header.appendChild(headerActions);

  const dropZone = el('div', 'drop-zone', 'drop images or click to add');
  const fileInput = el('input', 'file-input-hidden');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.accept = 'image/*';

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    if (fileInput.files) {
      await handleFiles(Array.from(fileInput.files));
      fileInput.value = '';
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer?.files) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  });

  const scrollContainer = el('div', 'queue-scroll');

  panel.appendChild(header);
  panel.appendChild(dropZone);
  panel.appendChild(scrollContainer);
  panel.appendChild(fileInput);

  async function handleFiles(files: File[]) {
    const valid = files.filter((f) => f.type.startsWith('image/'));
    const items = await Promise.all(
      valid.map(async (file) => {
        const { bitmap, url, width, height } = await createFileBitmap(file);
        return {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name.toLowerCase(),
          sizeBytes: file.size,
          width,
          height,
          originalBitmap: bitmap,
          originalUrl: url,
        };
      })
    );
    store.addImages(items);
  }

  store.subscribe(() => {
    const { images, activeImageId, isProcessing } = store.getState();
    const hasUpscaled = images.some((img) => img.upscaledCanvas);

    clearBtn.disabled = isProcessing || images.length === 0;
    downloadAllBtn.disabled = isProcessing || !hasUpscaled;

    scrollContainer.innerHTML = '';
    if (images.length === 0) {
      const emptyNotice = el('div', 'queue-empty-notice', 'no images in queue');
      scrollContainer.appendChild(emptyNotice);
      return;
    }

    for (const img of images) {
      const item = el('div', `queue-item${img.id === activeImageId ? ' active' : ''}`);
      item.addEventListener('click', () => store.setActiveImage(img.id));

      const thumb = el('img', 'queue-thumb') as HTMLImageElement;
      thumb.src = img.originalUrl;

      const info = el('div', 'queue-info');
      const displayName = img.upscaledCanvas ? `${img.name} (upscaled)` : img.name;
      const name = el('span', 'queue-name', displayName);

      const sizeText = img.upscaledSizeBytes
        ? `${formatBytes(img.sizeBytes)} -> ${formatBytes(img.upscaledSizeBytes)}`
        : formatBytes(img.sizeBytes);
      const sizeMeta = el('span', 'queue-meta', sizeText);

      const resText =
        img.upscaledWidth && img.upscaledHeight
          ? `${img.width}x${img.height} -> ${img.upscaledWidth}x${img.upscaledHeight}`
          : `${img.width}x${img.height}`;
      const resMeta = el('span', 'queue-meta', resText);

      info.appendChild(name);
      info.appendChild(sizeMeta);
      info.appendChild(resMeta);

      const actionBox = el('div', 'queue-actions');

      const dlBtn = el('button', '', '↓');
      dlBtn.title = 'download upscaled';
      dlBtn.disabled = isProcessing || !img.upscaledCanvas;

      dlBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!img.upscaledCanvas) return;
        const a = document.createElement('a');
        const dotIdx = img.name.lastIndexOf('.');
        const base = dotIdx !== -1 ? img.name.slice(0, dotIdx) : img.name;
        a.download = `${base}_upscaled.png`;
        a.href = img.upscaledCanvas.toDataURL('image/png');
        a.click();
      });

      const delBtn = el('button', '', 'x');
      delBtn.disabled = isProcessing;
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        store.removeImage(img.id);
      });

      actionBox.appendChild(dlBtn);
      actionBox.appendChild(delBtn);

      item.appendChild(thumb);
      item.appendChild(info);
      item.appendChild(actionBox);
      scrollContainer.appendChild(item);
    }
  });

  return panel;
}
