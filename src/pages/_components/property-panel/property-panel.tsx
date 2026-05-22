import { Box, Button, Item } from '@suis-ui/kit';
import {
  Grid3X3,
  Minus,
  Plus,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-solid';

import { Icon } from '@/components/ui/icon';
import { Slider } from '@/components/ui/slider';
import * as styles from './property-panel.css';

type PropertyPanelProps = {
  zoom: number;
  onZoomChange: (zoom: number) => void;
};

const ZOOM_MIN = 25;
const ZOOM_MAX = 200;
const ZOOM_STEP = 5;
const ZOOM_DEFAULT = 100;

const clampZoom = (zoom: number) =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));

export function PropertyPanel(props: PropertyPanelProps) {
  const handleZoomStep = (delta: number) => {
    props.onZoomChange(clampZoom(props.zoom + delta));
  };

  return (
    <Box
      as={'aside'}
      class={styles.panel}
      direction={'column'}
      gap={'sm'}
      bg={'surface.high'}
      bc={'surface.higher'}
      bd={'thin'}
      p={'sm'}
      r={'lg'}
      shadow={'xl'}
      aria-label={'Properties'}
    >
      <Item
        media={<Icon name={SlidersHorizontal} />}
        size={'sm'}
        title={'Properties'}
      />

      <Item
        media={<Icon name={Grid3X3} />}
        size={'sm'}
        title={'Grid Size'}
        action={
          <Box text={'caption'}>
            {'32px'}
          </Box>
        }
      />
      <Box>
        <Slider
          aria-label={'Zoom'}
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={ZOOM_STEP}
          value={props.zoom}
          onChange={(value: number) =>
            props.onZoomChange(clampZoom(value))
          }
        />
        {`${props.zoom}%`}
      </Box>
    </Box>
  );
}
