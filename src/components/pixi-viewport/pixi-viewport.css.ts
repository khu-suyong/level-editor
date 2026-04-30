import { style } from "@vanilla-extract/css";

export const viewport = style({
  position: "absolute",
  inset: 0,
  overflow: "hidden",
});

export const pixiCanvas = style({
  display: "block",
  width: "100%",
  height: "100%",
});
