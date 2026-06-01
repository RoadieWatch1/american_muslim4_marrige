// src/components/layout/ScrollToTop.tsx

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const root = document.getElementById("root");
      if (root) {
        root.scrollTop = 0;
      }

      const scrollContainers = document.querySelectorAll(
        "[data-scroll-container], .dashboard-content, .main-content, main"
      );

      scrollContainers.forEach((container) => {
        if (container instanceof HTMLElement) {
          container.scrollTop = 0;
        }
      });
    };

    requestAnimationFrame(resetScroll);
  }, [pathname, search]);

  return null;
}
