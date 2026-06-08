import { vars } from '@suis-ui/kit';
import { style } from '@vanilla-extract/css';
import { popupAnimation } from '@/helpers/popup-animation.css';

export const anchorStyle = style({
  pointerEvents: 'none',
});

export const backdropStyle = style({
  background: `rgba(from ${vars.color.surface.contrast} r g b / 0.5)`,
});

export const panelStyle = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 'calc(100vw - 2rem)',
  maxHeight: 'calc(100dvh - 2rem)',
  overflow: 'hidden',
});

export const bodyStyle = style({
  boxSizing: 'border-box',
  flex: '1 1 auto',
  minHeight: 0,
  overflowX: 'hidden',
  overflowY: 'auto',
  paddingRight: vars.size.space.xs,
});

export const dialogAnimation = popupAnimation({
  enter: {
    opacity: 0,
  },
  exit: {
    opacity: 0,
  },
});
