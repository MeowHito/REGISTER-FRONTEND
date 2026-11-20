import { useEffect, useState } from "react";
import Menu from "components/menu";
import { useLocation } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { isFullWidthPath } from "utils";

/**
 * Phones: the header slides away while the runner scrolls down and comes back as soon as they
 * scroll up (like the browser's own bar). In-app browsers (Google app, LINE, Facebook) already
 * take a big slice of the screen, and a header that stays put sat on top of the content.
 */
function useHideOnScrollDown(enabled, pathname) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => setHidden(false), [pathname]);

  useEffect(() => {
    if (!enabled) {
      setHidden(false);
      return undefined;
    }
    let last = globalThis.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = globalThis.scrollY;
        if (y < 80) setHidden(false);
        else if (y > last + 6) setHidden(true);
        else if (y < last - 6) setHidden(false);
        last = y;
        ticking = false;
      });
    };
    globalThis.addEventListener("scroll", onScroll, { passive: true });
    return () => globalThis.removeEventListener("scroll", onScroll);
  }, [enabled]);

  return hidden;
}

export default function Header() {
  const { pathname } = useLocation();
  const isFullWidth = isFullWidthPath(pathname);
  const isPhone = useMediaQuery({ query: "(max-width: 767px)" });
  const hidden = useHideOnScrollDown(isPhone, pathname);

  return (
    <header
      className={`sticky top-0 z-50 shadow-sm w-full mx-auto transition-transform duration-200 ${hidden ? "-translate-y-full" : ""} ${isFullWidth ? "" : "md:max-w-[1200px]"}`}
    >
      <Menu />
    </header>
  );
}
