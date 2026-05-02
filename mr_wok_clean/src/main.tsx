import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// StrictMode removed — it causes double-mounting in dev which looks like
// a page reload. Safe to remove; it only affects development behaviour.
createRoot(document.getElementById('root')!).render(<App />);
