import { vars } from '@suis-ui/kit';
import { style } from '@vanilla-extract/css';

export const content = style({
  width: '32rem',
  maxWidth: 'calc(100vw - 4rem)',
});

export const payloadPreview = style({
  width: '100%',
  minHeight: '16rem',
  maxHeight: '50vh',
  resize: 'vertical',
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '0.75rem',
  lineHeight: 1.5,
  whiteSpace: 'pre',
});

export const status = style({
  minHeight: vars.font.caption.lineHeight,
});

export const statusError = style({
  color: '#f87171',
});

export const statusSuccess = style({
  color: '#34d399',
});
