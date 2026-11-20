import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { scrollPageToTop } from "utils";

/**
 * React Router keeps the scroll position when the URL changes, so tapping an event card halfway
 * down the home page opened the event page halfway down too, with its top hidden under the
 * header. Every new page (link, navigate, redirect) now starts at the top; Back/Forward (POP)
 * is left to the browser so the runner returns to where they were.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType !== "POP") scrollPageToTop();
  }, [pathname, navigationType]);

  return null;
}
