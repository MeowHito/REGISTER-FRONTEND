import { useTranslation } from "react-i18next";

/**
 * Returns a `bi(key, opts)` helper that renders a translation key in BOTH Thai
 * and English at once ("ไทย / English"), regardless of the active language.
 *
 * The registration form mixes Thai+English labels by design, so validation
 * messages / buttons / placeholders should stay bilingual too. This reads both
 * locale bundles directly via i18next's `getFixedT`, so we don't have to bake
 * the dual-language string into every translation key.
 */
const useBilingual = () => {
  const { i18n } = useTranslation();
  const tTH = i18n.getFixedT("th");
  const tEN = i18n.getFixedT("en");

  return (key, opts) => {
    const th = tTH(key, opts);
    const en = tEN(key, opts);
    if (!th) return en;
    if (!en || th === en) return th;
    return `${th} / ${en}`;
  };
};

export default useBilingual;
