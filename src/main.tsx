import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'

// Tag the document ONLY when running inside the native Capacitor iOS shell.
// On the Vercel website the protocol is http(s):, so this class is never
// applied and the web layout is completely unaffected.
if (
  typeof window !== 'undefined' &&
  (window.location.protocol === 'capacitor:' ||
    (window as any).Capacitor?.isNativePlatform?.() === true)
) {
  document.documentElement.classList.add('capacitor-ios-app')
  document.body.classList.add('capacitor-ios-app')
}

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

