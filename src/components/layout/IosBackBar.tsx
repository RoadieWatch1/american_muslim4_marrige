// src/components/layout/IosBackBar.tsx
//
// iOS-only back navigation bar. Renders ONLY inside the native Capacitor
// shell — the `.ios-back-bar` class is `display:none` on the website and
// only made visible under `body.capacitor-ios-app` (see src/index.css), so
// the Vercel website never shows it. Gives users on inner pages a clear,
// reusable way back so they never feel trapped.
//
// Reuse on any inner page by rendering <IosBackBar title="Discover" />,
// or rely on the instance in DashboardLayout which covers every inner
// dashboard route automatically.
//
// The safe-area top spacing lives entirely in the `.ios-back-bar` CSS rule
// (padding-top: calc(env(safe-area-inset-top) + 16px)) so the bar always
// sits fully BELOW the Dynamic Island / status area. It is intentionally
// NOT position:sticky — sticky pinned it to viewport top-0 (inside the
// island) on scroll, which caused the overlap.
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface IosBackBarProps {
  /** Optional title shown next to the back arrow. */
  title?: string;
  /** Route to fall back to when there is no browser history to pop. */
  fallbackTo?: string;
}

export default function IosBackBar({
  title,
  fallbackTo = '/dashboard',
}: IosBackBarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    // Use existing app navigation: go back if there's history, else home.
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackTo);
    }
  };

  // Always rendered in the DOM; `.ios-back-bar` is display:none on the
  // website and only shown inside the native iOS app.
  return (
    <div className="ios-back-bar w-full max-w-full gap-2 border-b border-border/50 bg-white/95 backdrop-blur">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="inline-flex items-center gap-1 text-teal-700 active:opacity-70"
      >
        <ChevronLeft className="h-7 w-7" />
        <span className="text-lg font-semibold">Back</span>
      </button>

      {title && (
        <span className="truncate text-lg font-semibold text-gray-900">
          {title}
        </span>
      )}
    </div>
  );
}
