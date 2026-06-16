import Menu from "components/menu";
import { useLocation } from "react-router-dom";

export default function Header() {
  const { pathname } = useLocation();
  const isFullWidth = pathname.startsWith("/backoffice") || pathname === "/";

  return (
    <header className={`sticky top-0 z-50 shadow-sm w-full mx-auto ${isFullWidth ? "" : "md:max-w-[1200px]"}`}>
      <Menu />
    </header>
  );
}
