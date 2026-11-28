import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const loginUrl = new URLSearchParams(window.location.search).get('login');
if (loginUrl && !loginUrl.startsWith('$')) {
  try {
    const parsed = new URL(loginUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      sessionStorage.setItem('hotspotLogin', parsed.href);
    }
  } catch {
    // Ignore malformed or unexpanded RouterOS variables
  }
}

import App from './App.jsx';
import { ThemeProvider } from './theme/ThemeProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);