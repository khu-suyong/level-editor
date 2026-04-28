import { globalStyle } from "@vanilla-extract/css";

globalStyle("body", {
  minWidth: "960px",
  overflow: "hidden",
  color: "var(--suis-color-text-primary, #e5e7eb)",
  background: "var(--suis-color-background, #111827)",
  fontFamily:
    "var(--suis-font-family-sans, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
});

globalStyle("#root", {
  position: "fixed",
  inset: 0,
  zIndex: 0,
});

globalStyle("button", {
  border: 0,
});
