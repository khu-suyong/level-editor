import { vars } from '@suis-ui/kit';
import { style } from '@vanilla-extract/css';

export const backdrop = style({
  position: 'fixed',
  zIndex: 1000,
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  padding: vars.size.space.lg,
  background: 'rgb(15 23 42 / 0.46)',
});

export const panel = style({
  display: 'flex',
  width: 'min(34rem, 100%)',
  maxHeight: `calc(100vh - (${vars.size.space.lg} * 2))`,
  minHeight: 0,
  flexDirection: 'column',
  gap: vars.size.space.sm,
  padding: vars.size.space.md,
  border: `1px solid ${vars.color.surface.higher}`,
  borderRadius: vars.size.space.md,
  color: vars.color.text.main,
  background: vars.color.surface.high,
  boxShadow: vars.shadow.xl,
  outline: 0,
});

export const body = style({
  display: 'flex',
  minHeight: 0,
  flexDirection: 'column',
  gap: vars.size.space.sm,
  overflowY: 'auto',
});

export const footer = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: vars.size.space.xs,
});
