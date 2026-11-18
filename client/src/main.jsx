import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import { ThemeProvider } from './theme/ThemeProvider.jsx'

const path = window.location.pathname

function pickPage() {
  if (path.startsWith('/admin')) return <LoginPage role="admin" />
  if (path.startsWith('/tenant')) return <LoginPage role="tenant" />
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      {pickPage()}
    </ThemeProvider>
  </StrictMode>,
)