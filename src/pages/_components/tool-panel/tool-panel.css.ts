import { vars } from '@suis-ui/kit';
import { style } from '@vanilla-extract/css';

export const containerStyle = style({
  position: 'fixed',
  zIndex: 10,
  left: '50%',
  bottom: vars.size.space.lg,

  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: vars.size.space.sm,

  transform: 'translateX(-50%)',
});

export const groupStyle = style({
  flexDirection: 'row',

  background: `oklch(from ${vars.color.surface.high} l c h / 0.8)`,
  backdropFilter: 'blur(8px)',
  borderColor: vars.color.surface.higher,
  borderStyle: 'solid',
  borderWidth: vars.size.line.thin,
  borderRadius: vars.size.space.md,
  boxShadow: vars.shadow.md,

  padding: vars.size.space.xs,
  gap: vars.size.space.sm,
});
