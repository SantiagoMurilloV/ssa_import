import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/layout/ErrorBoundary.jsx';
import './styles/global.css';

// Service worker solo para los avisos push de la guía de envíos. No tiene
// handler de fetch, así que no cachea nada ni estorba al HMR de Vite: se
// registra también en desarrollo para poder probar las notificaciones.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
