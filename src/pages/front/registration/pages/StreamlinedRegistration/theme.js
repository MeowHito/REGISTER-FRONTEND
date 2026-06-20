// Palette pulled from the stitch design (Velocity Athletic System) so this page
// matches the provided mockup exactly, independent of the global brand colors.
export const C = {
  primary: "#006193",
  primaryFixed: "#cce5ff",
  onPrimary: "#ffffff",
  accent: "#fe9400", // secondary-container (Checkout button)
  onAccent: "#633700",
  outline: "#bfc7d2",
  surface: "#f7fafc",
  surfaceLow: "#f1f4f6",
  surfaceHigh: "#e5e9eb",
  ink: "#181c1e",
  inkVariant: "#3f4850",
  error: "#ba1a1a",
};

export const inputCls =
  "!h-12 !rounded-lg !border-[#bfc7d2] !text-base hover:!border-[#006193] focus:!border-[#006193] focus-within:!border-[#006193] [&_input]:!text-base";
export const selectCls =
  "w-full [&_.ant-select-selector]:!h-12 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-[#bfc7d2] [&_.ant-select-selector]:!items-center";

export const primaryBtn =
  "w-full bg-[#006193] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50";
