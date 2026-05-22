import { Box, Button, Item } from '@suis-ui/kit';
import { ChevronDown, ChevronUp, Layers, Menu, Square } from 'lucide-solid';
import { createMemo, createSignal, For, Show } from 'solid-js';

import { Icon } from '@/components/ui/icon';
import type { LevelData, LevelLayer } from '@/models/level';
import * as styles from './side-panel.css';

type SidePanelProps = {
  activeLayerId: string;
  level: LevelData;
  onSelectLayer: (layerId: string) => void;
};

const sortLayers = (layers: LevelLayer[]) =>
  [...layers].sort((first, second) => first.order - second.order);

export const SidePanel = (props: SidePanelProps) => {
  const layers = createMemo(() => sortLayers(props.level.layers));

  return (
    <Box
      as={'aside'}
      class={styles.panel}
      direction={'column'}
      gap={'md'}
      bg={'surface.high'}
      bc={'surface.higher'}
      bd={'thin'}
      p={'xs'}
      r={'lg'}
      shadow={'xl'}
      aria-label={'Level structure'}
    >
      <Box direction={'row'} align={'center'} gap={'xs'}>
        <Button variant={'ghost'} type={'icon'} size={'sm'} r={'md'}>
          <Icon name={Menu} />
        </Button>
        <Box text={'body'}>{props.level.name}</Box>
      </Box>
      <Box gap={'xs'}>
        <Box as={'h2'} text={'caption'} c={'text.caption'} px={'xs'}>
          {'Layers'}
        </Box>
        <Box as={'ul'} aria-label={'Layer tree'}>
          <For each={layers()}>
            {(layer) => (
              <LayerItem layer={layer} activeLayerId={props.activeLayerId} />
            )}
          </For>
        </Box>
      </Box>
    </Box>
  );
};

type LayerItemProps = {
  layer: LevelLayer;
  activeLayerId?: string;
};
const LayerItem = (props: LayerItemProps) => {
  const [expand, setExpand] = createSignal(false);

  return (
    <Box as={'li'}>
      <Item
        as={Button}
        variant={'ghost'}
        media={<Icon name={Layers} />}
        title={
          <Box
            direction={'row'}
            justify={'flex-start'}
            align={'center'}
            gap={'xs'}
          >
            <Box as={'span'}>{props.layer.name}</Box>
            <Box as={'span'} text={'caption'} c={'text.caption'}>
              {props.layer.id}
            </Box>
          </Box>
        }
        action={<Icon name={expand() ? ChevronUp : ChevronDown} />}
        active={props.activeLayerId === props.layer.id}
        onClick={() => setExpand((prev) => !prev)}
      />
      <Show when={expand()}>
        <Box as={'ul'} pl={'md'}>
          <For each={props.layer.tiles}>
            {(tile) => (
              <Item
                as={'li'}
                class={styles.tileItem}
                media={<Icon name={Square} />}
                title={
                  <Box
                    direction={'row'}
                    justify={'flex-start'}
                    align={'center'}
                    gap={'xs'}
                  >
                    <Box as={'span'}>{`Tile ${tile.tileId}`}</Box>
                    <Box
                      as={'span'}
                      text={'caption'}
                      c={'text.caption'}
                    >{`${tile.x}, ${tile.y}`}</Box>
                  </Box>
                }
                justify={'flex-start'}
              />
            )}
          </For>
        </Box>
      </Show>
    </Box>
  );
};
