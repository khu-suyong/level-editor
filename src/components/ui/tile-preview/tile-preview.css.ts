import { vars } from '@suis-ui/kit';
import { style } from '@vanilla-extract/css';

export const preview = style({
  display: 'grid',
  placeItems: 'center',
  width: vars.size.space.xl,
  height: vars.size.space.xl,
  flex: '0 0 auto',
  border: '1px solid color-mix(in oklch, currentColor 28%, transparent)',
  borderRadius: vars.size.space.xxs,
});
