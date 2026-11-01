import { store } from '../state/store';
import { el } from '../utils/dom';

export function createViewer(): HTMLElement {
  const container = el('div', 'comparison-container');
  const emptyView = el('div', 'empty-view');
  const emptyText = el('span', '', 'no image selected');
  emptyView.appendChild(emptyText);
  container.appendChild(emptyView);

  let isDragging = false;
  let activeRenderedId: string | null = null;
  let activeHasUpscale = false;

  let currentOverlay: HTMLElement | null = null;
  let currentDivider: HTMLElement | null = null;

  const resizeObserver = new ResizeObserver(() => {
    activeRenderedId = null;
    const { images, activeImageId } = store.getState();
    if (images.find((i) => i.id === activeImageId)) {
      render();
    }
  });
  resizeObserver.observe(container);

  function updateSplit(clientX: number, rect: DOMRect) {
    const rawPos = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.min(100, Math.max(0, rawPos));
    if (currentOverlay && currentDivider) {
      currentOverlay.style.clipPath = `polygon(${clamped}% 0, 100% 0, 100% 100%, ${clamped}% 100%)`;
      currentDivider.style.left = `${clamped}%`;
    }
    store.setSplitPosition(clamped);
  }

  function setupDragEvents(box: HTMLElement) {
    const onPointerDown = (e: PointerEvent) => {
      const { images, activeImageId } = store.getState();
      const active = images.find((i) => i.id === activeImageId);
      if (!active?.upscaledCanvas) return;

      isDragging = true;
      box.setPointerCapture(e.pointerId);
      updateSplit(e.clientX, box.getBoundingClientRect());
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      updateSplit(e.clientX, box.getBoundingClientRect());
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDragging) {
        isDragging = false;
        try {
          box.releasePointerCapture(e.pointerId);
        } catch {}
      }
    };

    box.addEventListener('pointerdown', onPointerDown);
    box.addEventListener('pointermove', onPointerMove);
    box.addEventListener('pointerup', onPointerUp);
    box.addEventListener('pointercancel', onPointerUp);
  }

  function render() {
    const { images, activeImageId, splitPosition } = store.getState();
    const activeImage = images.find((i) => i.id === activeImageId);

    if (!activeImage) {
      container.innerHTML = '';
      container.appendChild(emptyView);
      activeRenderedId = null;
      activeHasUpscale = false;
      currentOverlay = null;
      currentDivider = null;
      return;
    }

    const hasUpscale = !!activeImage.upscaledCanvas;

    if (activeRenderedId === activeImage.id && activeHasUpscale === hasUpscale) {
      if (currentOverlay && currentDivider) {
        currentOverlay.style.clipPath = `polygon(${splitPosition}% 0, 100% 0, 100% 100%, ${splitPosition}% 100%)`;
        currentDivider.style.left = `${splitPosition}%`;
      }
      return;
    }

    activeRenderedId = activeImage.id;
    activeHasUpscale = hasUpscale;

    container.innerHTML = '';
    const wrapper = el('div', 'comparison-wrapper');
    const box = el('div', 'image-canvas-box');

    const containerRect = container.getBoundingClientRect();
    const availW = containerRect.width;
    const availH = containerRect.height;

    const aspect = activeImage.width / activeImage.height;
    let fitW: number;
    let fitH: number;

    if (availW / availH > aspect) {
      fitH = availH;
      fitW = fitH * aspect;
    } else {
      fitW = availW;
      fitH = fitW / aspect;
    }

    box.style.width = `${Math.round(fitW)}px`;
    box.style.height = `${Math.round(fitH)}px`;

    const baseImg = el('img') as HTMLImageElement;
    baseImg.src = activeImage.originalUrl;
    baseImg.draggable = false;
    baseImg.style.width = '100%';
    baseImg.style.height = '100%';
    box.appendChild(baseImg);

    if (activeImage.upscaledCanvas) {
      const overlay = el('div', 'image-overlay');
      overlay.style.clipPath = `polygon(${splitPosition}% 0, 100% 0, 100% 100%, ${splitPosition}% 100%)`;

      const upscaledCanvas = activeImage.upscaledCanvas;
      overlay.appendChild(upscaledCanvas);
      box.appendChild(overlay);

      const divider = el('div', 'split-divider');
      divider.style.left = `${splitPosition}%`;

      const handle = el('div', 'split-handle', '↔');
      divider.appendChild(handle);
      box.appendChild(divider);

      const labelLeft = el('div', 'label-pill left', 'original');
      const labelRight = el('div', 'label-pill right', 'upscaled');
      box.appendChild(labelLeft);
      box.appendChild(labelRight);

      currentOverlay = overlay;
      currentDivider = divider;

      setupDragEvents(box);
    } else {
      currentOverlay = null;
      currentDivider = null;
      const labelSingle = el('div', 'label-pill left', 'original');
      box.appendChild(labelSingle);
    }

    wrapper.appendChild(box);
    container.appendChild(wrapper);
  }

  store.subscribe(render);

  return container;
}
