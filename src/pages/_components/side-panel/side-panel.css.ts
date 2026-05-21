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

export const sectionTitle = style({
  margin: 0,
  fontWeight: vars.font.title.fontWeight,
  lineHeight: vars.font.caption.lineHeight,
  textTransform: 'uppercase',
});

export const treeList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.size.space.xs,
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

export const treeChildList = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.size.space.xs,
  margin: `${vars.size.space.xs} 0 ${vars.size.space.sm}`,
  padding: `0 0 0 calc(${vars.size.space.md} + ${vars.size.space.xs})`,
  listStyle: 'none',

  '::before': {
    position: 'absolute',
    top: 0,
    bottom: vars.size.space.xs,
    left: vars.size.space.sm,
    width: vars.size.line.thin,
    background: vars.color.surface.higher,
    content: '""',
  },
});

export const treeChildItem = style({
  position: 'relative',

  '::before': {
    position: 'absolute',
    top: '50%',
    left: `calc(${vars.size.space.md} * -1)`,
    width: vars.size.space.md,
    height: vars.size.line.thin,
    background: vars.color.surface.higher,
    content: '""',
  },
});

export const treeItem = style({
  width: '100%',
  borderWidth: 0,
  background: 'transparent',
  color: vars.color.text.main,
  cursor: 'pointer',
  textAlign: 'left',

  selectors: {
    '&:hover': {
      background: vars.color.surface.main,
    },
  },
});

export const treeItemActive = style({
  background: vars.color.surface.main,
  boxShadow: `inset 2px 0 0 ${vars.color.primary.main}`,
});

export const treeItemMedia = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.size.space.xs,
});

export const tileSwatch = style({
  display: 'block',
  width: '1rem',
  height: '1rem',
  flex: '0 0 auto',
  borderRadius: vars.size.space.xs,
  boxShadow: `inset 0 0 0 1px ${vars.color.surface.higher}`,
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
