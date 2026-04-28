import { vars } from "@suis-ui/kit";
import { style } from "@vanilla-extract/css";

export const shell = style({
  position: "relative",
  width: "100vw",
  height: "100vh",
  overflow: "hidden",
});

export const canvasLayer = style({
  position: "absolute",
  inset: 0,
  minWidth: 0,
  minHeight: 0,
});

export const appMark = style({
  display: "grid",
  placeItems: "center",
  width: vars.size.space.xl,
  height: vars.size.space.xl,
  flex: "0 0 auto",
  borderRadius: vars.size.space.sm,
  fontSize: vars.font.caption.fontSize,
  fontWeight: vars.font.title.fontWeight,
  lineHeight: vars.font.caption.lineHeight,
});

export const brandRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.size.space.md,
  minWidth: 0,
});

export const actionRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.size.space.sm,
  minWidth: 0,
});

export const title = style({
  margin: 0,
  overflow: "hidden",
  fontWeight: vars.font.title.fontWeight,
  lineHeight: vars.font.body.lineHeight,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const subtitle = style({
  margin: `${vars.size.space.xxs} 0 0`,
  lineHeight: vars.font.caption.lineHeight,
});

const floatingPanel = style({
  position: "absolute",
  zIndex: 10,
  padding: vars.size.space.md,
  borderRadius: vars.size.space.sm,
  boxShadow: vars.shadow.xl,
  backdropFilter: "blur(10px)",
});

export const floatingHeader = style([
  floatingPanel,
  {
    top: vars.size.space.lg,
    left: vars.size.space.lg,
    width: "26rem",
  },
]);

export const floatingTools = style([
  floatingPanel,
  {
    left: vars.size.space.lg,
    bottom: "9.6rem",
    width: "22rem",
  },
]);

export const floatingProperties = style([
  floatingPanel,
  {
    top: vars.size.space.lg,
    right: vars.size.space.lg,
    width: "28rem",
  },
]);

export const panelDivider = style({
  height: vars.size.line.thin,
  margin: `${vars.size.space.xxs} 0`,
  background: vars.color.surface.higher,
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
