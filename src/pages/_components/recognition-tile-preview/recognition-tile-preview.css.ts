import { vars } from '@suis-ui/kit';
import { style } from '@vanilla-extract/css';

export const previewFrameStyle = style({
  boxSizing: 'border-box',
  width: '100%',
  minHeight: '14rem',
  overflow: 'hidden',
  border: `1px solid ${vars.color.surface.higher}`,
  background: vars.color.surface.high,
});

export const previewCanvasStyle = style({
  display: 'block',
  width: '100%',
  height: 'auto',
});

export const previewPlaceholderStyle = style({
  minHeight: '14rem',
});

export const assumptionStyle = style({
  border: `1px solid ${vars.color.warn.main}`,
  color: vars.color.warn.main,
});
