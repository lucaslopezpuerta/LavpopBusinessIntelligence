import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initErrorTracking, captureError } from './utils/errorTracking'

// Initialize error tracking before rendering
initErrorTracking()

// Global error handler for uncaught errors
window.onerror = (message, source, lineno, colno, error) => {
  captureError(error || new Error(message), {
    source: 'window.onerror',
    location: `${source}:${lineno}:${colno}`,
  })
}

// Global handler for unhandled promise rejections
window.onunhandledrejection = (event) => {
  captureError(event.reason || new Error('Unhandled Promise Rejection'), {
    source: 'unhandledrejection',
    promise: String(event.promise),
  })
}

createRoot(document.getElementById('root')).render(<App />)
