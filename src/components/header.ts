import { store } from '../state/store';
import { el } from '../utils/dom';

export function createHeader(): HTMLElement {
  const header = el('header', 'header-bar');
  const title = el('span', 'header-title', 'uscale');
  const toggleBtn = el('button', 'header-toggle', 'queue/model');

  toggleBtn.addEventListener('click', () => {
    const { drawerOpen } = store.getState();
    store.setDrawerOpen(!drawerOpen);
  });

  header.appendChild(title);
  header.appendChild(toggleBtn);

  store.subscribe(() => {
    const { drawerOpen, isProcessing } = store.getState();
    toggleBtn.textContent = drawerOpen ? 'close' : 'queue/model';
    toggleBtn.disabled = isProcessing;
  });

  return header;
}
