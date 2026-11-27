
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
const loginUrl = new URLSearchParams(window.location.search).get('login');
if (loginUrl) {
  sessionStorage.setItem('hotspotLogin', loginUrl);
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
