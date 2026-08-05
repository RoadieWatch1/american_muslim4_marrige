import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Only force a scroll-to-top on forward navigation (PUSH/REPLACE).
    // On back/forward history navigation (POP), resetting scroll here is
    // what made returning to a page (e.g. search results) feel like
    // starting over every time instead of restoring where the user was.
    if (navigationType === "POP") return;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto", // instant (best for legal pages)
    });
  }, [pathname, navigationType]);

  return null;
}
