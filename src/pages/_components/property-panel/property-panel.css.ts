import { vars } from "@suis-ui/kit";
import { style } from "@vanilla-extract/css";

export const panel = style({
  position: "absolute",
  zIndex: 10,
  top: vars.size.space.lg,
  right: vars.size.space.lg,
  width: "28rem",
  padding: vars.size.space.md,
  borderRadius: vars.size.space.sm,
  boxShadow: vars.shadow.xl,
  backdropFilter: "blur(10px)",
});

export const panelHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  minWidth: 0,
});

export const panelTitle = style({
  margin: 0,
  fontWeight: vars.font.title.fontWeight,
  letterSpacing: vars.font.caption.letterSpacing,
  lineHeight: vars.font.caption.lineHeight,
  textTransform: "uppercase",
});

export const zoomControl = style({
  display: "grid",
  gridTemplateColumns: `${vars.size.space.xxl} minmax(0, 1fr) ${vars.size.space.xxl}`,
  alignItems: "center",
  gap: vars.size.space.sm,
});

export const zoomRange = style({
  width: "100%",
});

export const zoomOutput = style({
  textAlign: "right",
});

export const propertyList = style({
  display: "grid",
  gap: vars.size.space.sm,
  margin: 0,
});

export const propertyRow = style({
  display: "grid",
  gridTemplateColumns: "8rem minmax(0, 1fr)",
  alignItems: "center",
  minHeight: vars.size.space.xl,
  padding: `0 ${vars.size.space.sm}`,
});

export const propertyTerm = style({});

export const propertyDetail = style({
  margin: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
