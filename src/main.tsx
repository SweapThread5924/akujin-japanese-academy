import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initServiceWorker } from './utils/serviceWorkerRegistration';

// Bypass Service Worker caching during development so code changes appear immediately;
// register with updateViaCache: 'none' in production builds.
initServiceWorker(import.meta.env.DEV);

createRoot(document.getElementById('root')!).render(<App />);
