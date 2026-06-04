import { vars } from '@suis-ui/kit';
import { style } from '@vanilla-extract/css';

export const content = style({
  maxHeight: 'min(62vh, 42rem)',
  overflow: 'auto',
  paddingRight: vars.size.space.xs,
});

export const shortcutRow = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(9rem, auto)',
  gap: vars.size.space.md,
  alignItems: 'center',
});

export const keyList = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: vars.size.space.xs,
});

export const keyToken = style({
  minWidth: '1.75rem',
  padding: `${vars.size.space.xxs} ${vars.size.space.xs}`,
  borderRadius: vars.size.round.sm,
  border: `1px solid ${vars.color.surface.higher}`,
  background: vars.color.surface.high,
  color: vars.color.text.main,
  fontFamily: 'inherit',
  fontSize: vars.font.caption.fontSize,
  lineHeight: vars.font.caption.lineHeight,
  textAlign: 'center',
});
