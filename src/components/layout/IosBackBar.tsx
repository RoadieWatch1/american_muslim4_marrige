// src/components/layout/IosBackBar.tsx
//
// iOS-only back navigation bar. Renders ONLY inside the native Capacitor
// shell (detected via the `capacitor-ios-app` class set in main.tsx), so
// the Vercel website never shows it. Gives users on inner pages a clear,
// reusable way back so they never feel trapped.
//
// Reuse on any inner page by rendering <IosBackBar title="Discover" />,
// or rely on the instance in DashboardLayout which covers every inner
// dashboard route automatically.
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

function isCapacitorIosApp(): boolean {
  return (
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('capacitor-ios-app')
  );
}

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

  // Native iOS app only — website renders nothing.
  if (!isCapacitorIosApp()) return null;

  const handleBack = () => {
    // Use existing app navigation: go back if there's history, else home.
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackTo);
    }
  };

  return (
    <div className="ios-header-safe sticky top-0 z-40 flex w-full max-w-full items-center gap-2 border-b bg-white/95 pb-2 backdrop-blur">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="flex items-center gap-1 rounded-md py-1 pr-2 text-teal-700 active:opacity-70"
      >
        <ChevronLeft className="h-6 w-6" />
        <span className="text-base font-medium">Back</span>
      </button>

      {title && (
        <span className="truncate text-base font-semibold text-gray-900">
          {title}
        </span>
      )}
    </div>
  );
}
