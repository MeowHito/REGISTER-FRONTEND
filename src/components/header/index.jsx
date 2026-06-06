import Menu from "components/menu";

export default function Header() {

  return (
    <header className="md:fixed md:h-[65px] shadow-sm w-full md:max-w-[1200px] mx-auto z-50 bg-inherit">
      <Menu />
    </header>
  );
}
