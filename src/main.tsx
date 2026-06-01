import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'

// Tag the document ONLY when running inside the native Capacitor iOS shell.
// On the Vercel website the protocol is http(s):, so this class is never
// applied and the web layout is completely unaffected.
const isCapacitorIosApp =
  typeof window !== 'undefined' &&
  (window.location.protocol === 'capacitor:' ||
    (window as any).Capacitor?.isNativePlatform?.() === true)

if (isCapacitorIosApp) {
  document.documentElement.classList.add('capacitor-ios-app')
  document.body.classList.add('capacitor-ios-app')

  // iOS WebViews sometimes keep STALE env(safe-area-inset-*) values after the
  // app returns from the background, so safe-area padding (e.g. the Back bar)
  // can render out of place until something forces a relayout. On every
  // resume/visibility change we briefly toggle a class whose imperceptible
  // min-height change triggers a reflow, making the WebView recompute the
  // insets. iOS-only; the website never runs this because the native class
  // above is never added there. The dataset guard ensures the listeners are
  // attached only once even if this module is re-evaluated (HMR/dev refresh).
  if (!document.body.dataset.iosReflowSetup) {
    document.body.dataset.iosReflowSetup = 'true'

    const forceSafeAreaReflow = () => {
      document.body.classList.add('ios-reflow-fix')
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.body.classList.remove('ios-reflow-fix')
        })
      })
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') forceSafeAreaReflow()
    })
    window.addEventListener('pageshow', forceSafeAreaReflow)
    window.addEventListener('focus', forceSafeAreaReflow)
  }
}

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

