import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './sprites.css';
import './isaac-viewport.css';
import './visual-tuning.css';
import './isaac-paper-ui.css';
import './custom-menu-frame.css';
import './main-only-polish.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
