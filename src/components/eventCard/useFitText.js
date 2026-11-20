import { useLayoutEffect, useRef } from "react";

/**
 * Keeps a single-line heading on one line: starts from the font size its CSS classes give it and
 * steps down 1px at a time until the text fits, but never below `min`. Past that it ends in "…"
 * (the element needs `whitespace-nowrap overflow-hidden text-ellipsis`). Re-fits when the card
 * is resized or the web font finishes loading.
 */
export default function useFitText(text, min = 13) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const fit = () => {
      el.style.fontSize = "";
      let size = parseFloat(getComputedStyle(el).fontSize) || 16;
      while (el.scrollWidth > el.clientWidth + 1 && size > min) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
    };

    fit();
    let alive = true;
    document.fonts?.ready?.then(() => alive && fit());
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    // Watch the parent: its width doesn't depend on our font size, so fitting can't re-trigger itself.
    ro?.observe(el.parentElement || el);
    return () => {
      alive = false;
      ro?.disconnect();
    };
  }, [text, min]);

  return ref;
}
