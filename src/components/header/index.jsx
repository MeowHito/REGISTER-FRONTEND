import Menu from "components/menu";
import { useLocation } from "react-router-dom";

export default function Header() {
  const isBackoffice = useLocation().pathname.startsWith("/backoffice");

  return (
    <header className={`sticky top-0 z-50 shadow-sm w-full mx-auto ${isBackoffice ? "" : "md:max-w-[1200px]"}`}>
      <Menu />
    </header>
  );
}
