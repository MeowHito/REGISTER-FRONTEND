const BRACED = /\{([^{}]+)\}/g;

/** Splits "I accept {the rules}" into text and link parts. */
export const parseCondition = (value = "") => {
  const text = String(value ?? "");
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(BRACED)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ text: m[1], link: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
};

/** The condition without its braces, e.g. for a popup title or plain list. */
export const plainCondition = (text = "") => String(text).replace(BRACED, "$1");
