import { vars } from "@suis-ui/kit";
import { style } from "@vanilla-extract/css";

export const panel = style({
  position: "absolute",
  zIndex: 10,
  left: "50%",
  bottom: vars.size.space.lg,
  width: "22rem",
  padding: vars.size.space.md,
  borderRadius: vars.size.space.sm,
  boxShadow: vars.shadow.xl,
  backdropFilter: "blur(10px)",
  transform: "translateX(-50%)",
});

export const panelTitle = style({
  margin: 0,
  fontWeight: vars.font.title.fontWeight,
  letterSpacing: vars.font.caption.letterSpacing,
  lineHeight: vars.font.caption.lineHeight,
  textTransform: "uppercase",
});

export const toolList = style({
  display: "grid",
  gap: vars.size.space.xs,
});

export const toolButton = style({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  minHeight: vars.size.space.xl,
  textAlign: "left",
});

export const toolShortcut = style({
  fontSize: vars.font.caption.fontSize,
  lineHeight: vars.font.caption.lineHeight,
});
