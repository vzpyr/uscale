import './styles/app.css';

import { store } from './state/store';
import { el } from './utils/dom';
import { createHeader } from './components/header';
import { createQueue } from './components/queue';
import { createModel } from './components/model';
import { createViewer } from './components/viewer';

async function bootstrap() {
  const app = document.getElementById('app');
  if (!app) return;

  const header = createHeader();
  const mainLayout = el('main', 'main-layout');

  const leftStack = el('aside', 'left-stack');
  const queuePanel = createQueue();
  const modelPanel = createModel();
  leftStack.appendChild(queuePanel);
  leftStack.appendChild(modelPanel);

  const viewer = createViewer();

  mainLayout.appendChild(leftStack);
  mainLayout.appendChild(viewer);

  app.appendChild(header);
  app.appendChild(mainLayout);

  store.subscribe(() => {
    const { isProcessing, drawerOpen } = store.getState();
    if (isProcessing) {
      app.classList.add('app-locked');
    } else {
      app.classList.remove('app-locked');
    }

    if (drawerOpen) {
      leftStack.classList.add('open');
    } else {
      leftStack.classList.remove('open');
    }
  });
}

bootstrap();
