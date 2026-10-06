import { useTranslation } from "react-i18next";

/**
 * Returns a `bi(key, opts)` helper for the registration pages.
 *
 * It used to render every key in Thai AND English at once ("ไทย / English").
 * The pages now follow the site language like everywhere else, so this is a
 * thin alias of `t` kept so the call sites didn't all have to be renamed.
 */
const useBilingual = () => {
  const { t } = useTranslation();
  return (key, opts) => t(key, opts);
};

export default useBilingual;
