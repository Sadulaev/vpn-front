import React from 'react';
import ReactDOM from 'react-dom/client';
import MiniApp from './app/MiniApp';

// Initialize Telegram Web App
const twa = window.Telegram?.WebApp;
if (twa) {
  twa.ready();
  twa.expand();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MiniApp />
  </React.StrictMode>,
);
