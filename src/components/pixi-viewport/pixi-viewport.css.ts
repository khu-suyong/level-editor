import { vars } from '@suis-ui/kit';
import { style } from '@vanilla-extract/css';

export const viewport = style({
  position: 'absolute',
  inset: 0,
  background: vars.color.surface.main,
  color: vars.color.surface.high,
  borderColor: vars.color.surface.higher,
  overflow: 'hidden',
  cursor: 'crosshair',
  outline: 'none',
  userSelect: 'none',
});

export const pixiCanvas = style({
  display: 'block',
  width: '100%',
  height: '100%',
});

export const isPanTool = style({
  cursor: 'grab',
});

export const isPanning = style({
  cursor: 'grabbing',
});

export const isSelectionDraggable = style({
  cursor: 'grab',
});

export const isSelectionDragging = style({
  cursor: 'grabbing',
});

export const contextMenu = style({
  position: 'absolute',
  pointerEvents: 'none',
});

export const contextMenuPanel = style({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  overflow: 'hidden',
});

export const contextMenuGroup = style({
  padding: vars.size.space.xs,
  borderRadius: vars.size.space.md,
  overflow: 'hidden',

  selectors: {
    '&:has( + li)': {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    'li + &': {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderTopStyle: 'solid',
      borderTopWidth: vars.size.line.md,
      borderTopColor: vars.color.surface.higher,
    },
  },
});

export const contextMenuList = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  margin: 0,
  padding: 0,
  listStyle: 'none',
});
