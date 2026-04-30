import { vars } from '@suis-ui/kit';
import { style } from '@vanilla-extract/css';

export const panel = style({
  position: 'absolute',
  zIndex: 10,
  top: vars.size.space.lg,
  left: vars.size.space.lg,
  width: '26rem',
  padding: vars.size.space.md,
  borderRadius: vars.size.space.sm,
  boxShadow: vars.shadow.xl,
  backdropFilter: 'blur(10px)',
});

export const appMark = style({
  display: 'grid',
  placeItems: 'center',
  width: vars.size.space.xl,
  height: vars.size.space.xl,
  flex: '0 0 auto',
  borderRadius: vars.size.space.sm,
  fontSize: vars.font.caption.fontSize,
  fontWeight: vars.font.title.fontWeight,
  lineHeight: vars.font.caption.lineHeight,
});

export const brandRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.size.space.md,
  minWidth: 0,
});

export const actionRow = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: vars.size.space.sm,
  minWidth: 0,
});

export const title = style({
  margin: 0,
  overflow: 'hidden',
  fontWeight: vars.font.title.fontWeight,
  lineHeight: vars.font.body.lineHeight,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const subtitle = style({
  margin: `${vars.size.space.xxs} 0 0`,
  lineHeight: vars.font.caption.lineHeight,
});
