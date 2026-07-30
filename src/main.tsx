import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite websocket reconnect interruptions in sandboxed container preview
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (
      String(event.reason.message || event.reason).includes('WebSocket') ||
      String(event.reason).includes('WebSocket') ||
      String(event.reason).includes('websocket')
    )) {
      event.preventDefault();
    }
  });

  const originalError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && (args[0].includes('[vite] failed to connect') || args[0].includes('WebSocket'))) {
      return;
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
