import { Box } from '@suis-ui/kit';
import {
  AppWindow,
  ChartNoAxesColumnIncreasing,
  DoorOpen,
  Minus,
  Star,
  Triangle,
} from 'lucide-solid';

import type { TileIcon, TileMapping } from '@/models/level';
import { Icon, type IconType } from '../icon';
import * as styles from './tile-preview.css';

const tileIconMap = {
  star: Star,
  triangle: Triangle,
  line: Minus,
  door: DoorOpen,
  window: AppWindow,
  stairs: ChartNoAxesColumnIncreasing,
} as const satisfies Record<TileIcon, IconType>;

export const getTileIconComponent = (icon: TileIcon) => tileIconMap[icon];

type TilePreviewProps = {
  size?: number;
  tile: Pick<TileMapping, 'backgroundColor' | 'icon' | 'iconColor'>;
};

export const TilePreview = (props: TilePreviewProps) => (
  <Box
    as={'span'}
    class={styles.preview}
    style={{
      width: `${props.size ?? 24}px`,
      height: `${props.size ?? 24}px`,
      'background-color': props.tile.backgroundColor,
      color: props.tile.iconColor,
    }}
  >
    <Icon name={getTileIconComponent(props.tile.icon)} size={14} />
  </Box>
);
