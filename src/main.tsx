import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite websocket reconnect & HTML5 video play interruption errors in preview
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason?.message || event.reason || '');
    if (
      reasonStr.includes('WebSocket') ||
      reasonStr.includes('websocket') ||
      reasonStr.includes('interrupted by a new load request') ||
      reasonStr.includes('play() request was interrupted') ||
      reasonStr.includes('no supported sources') ||
      reasonStr.includes('NotAllowedError')
    ) {
      event.preventDefault();
    }
  });

  const originalError = console.error;
  console.error = (...args) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('[vite] failed to connect') || 
      msg.includes('WebSocket') || 
      msg.includes('interrupted by a new load request') ||
      msg.includes('The element has no supported sources')
    ) {
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
