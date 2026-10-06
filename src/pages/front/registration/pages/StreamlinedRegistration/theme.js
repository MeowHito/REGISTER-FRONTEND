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
// `!h-12` on the Select root too: the selector box is 48px tall but antd's root stays 32px,
// which made the validation text render on top of the box and hide behind the next field.
export const selectCls =
  "w-full !h-12 [&_.ant-select-selector]:!h-12 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-[#bfc7d2] [&_.ant-select-selector]:!items-center";

export const primaryBtn =
  "w-full bg-[#006193] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50";

// Shared class for every CommonForm.Item on the form. Keeps fields tight, but —
// unlike a bare `!mb-0` — gives the validation message ("explain") its own
// in-flow space with a small reserved gap when an error shows, so the red text
// never collides with / hides behind the next field's box.
// antd also adds a `.ant-form-item-margin-offset` div with a negative margin to
// pull the next field up over the explain text; with `mb-0` that negative margin
// is what made the error line disappear under the next label, so zero it.
export const fieldItemCls =
  "!mb-0 [&.ant-form-item-has-error]:!mb-2 " +
  "[&_.ant-form-item-explain]:!text-xs [&_.ant-form-item-explain]:!leading-snug " +
  "[&_.ant-form-item-explain]:!pt-1 [&_.ant-form-item-explain]:!min-h-0 " +
  "[&_.ant-form-item-margin-offset]:!m-0";

// Phase / payment-type badge shown on a ticket card (e.g. "Early Bird").
export const phaseBadgeCls =
  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#cce5ff] text-[#006193]";

// Distance / team badge on an applicant card header — solid so it stands out from the grey bar.
export const ticketBadgeCls =
  "inline-flex items-center max-w-[60vw] truncate px-3 py-1 rounded-full text-xs font-bold bg-[#006193] text-white shadow-sm";
