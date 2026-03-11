import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker } from './src/registerServiceWorker';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker in production
if (import.meta.env.PROD) {
  registerServiceWorker((notification) => {
    console.log('Applying app update automatically');
    notification.onUpdate();
  });
}
