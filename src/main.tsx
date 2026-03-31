import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ─── BOOT-TIME MODEL PIPELINE ──────────────────────────────────────────────
// No local prewarm needed for cloud-based Gemini API.
// ───────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
