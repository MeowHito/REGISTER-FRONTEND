import Menu from "components/menu";
import { useLocation } from "react-router-dom";
import { isFullWidthPath } from "utils";

export default function Header() {
  const { pathname } = useLocation();
  const isFullWidth = isFullWidthPath(pathname);

  return (
    <header className={`sticky top-0 z-50 shadow-sm w-full mx-auto ${isFullWidth ? "" : "md:max-w-[1200px]"}`}>
      <Menu />
    </header>
  );
}
