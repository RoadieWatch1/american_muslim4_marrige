import { useEffect, useRef } from "react";

interface CCBillCheckoutProps {
  widgetClass: string;
  scriptSrc: string;
}

/**
 * Renders the CCBill LIVE widget exactly as provided by CCBill.
 * Uses useRef + useEffect to append the script after mount,
 * which is the React-safe equivalent of:
 *
 *   <div class="ccbillWidgetContainer">
 *     <script class="CCBillWidget..." src="...ccbill-widget-live.js"></script>
 *   </div>
 */
export default function CCBillCheckout({ widgetClass, scriptSrc }: CCBillCheckoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any previous render
    container.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.className = widgetClass;
    script.src = scriptSrc;

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [widgetClass, scriptSrc]);

  return <div className="ccbillWidgetContainer" ref={containerRef} />;
}
