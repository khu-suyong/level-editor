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

export const contextMenuHeader = style({
  padding: '0.35rem 0.55rem',
  color: 'rgb(148 163 184)',
  fontSize: '0.75rem',
  lineHeight: 1.3,
});

export const contextMenuButton = style({
  width: '100%',
  minHeight: '2rem',
  padding: '0 0.55rem',
  border: 0,
  borderRadius: '0.35rem',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: '0.8125rem',
  lineHeight: 1,
  textAlign: 'left',

  ':hover': {
    background: 'rgb(51 65 85 / 0.72)',
  },

  ':disabled': {
    color: 'rgb(100 116 139)',
    cursor: 'not-allowed',
  },
});
