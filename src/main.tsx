import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { HttpDragonsApi } from './api/http-dragons-api';
import { GameProvider } from './state/GameProvider';
import './styles/tokens.css';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

const api = new HttpDragonsApi({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://dragonsofmugloar.com/api/v2',
  timeoutMs: 10_000,
  retry: {
    attempts: 5,
    baseDelayMs: 500,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  },
});

createRoot(root).render(
  <StrictMode>
    <GameProvider api={api}>
      <App />
    </GameProvider>
  </StrictMode>,
);
