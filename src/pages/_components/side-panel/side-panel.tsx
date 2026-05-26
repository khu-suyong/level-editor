import { Box, Button, CheckBox, Item } from '@suis-ui/kit';
import { ChevronDown, ChevronUp, Menu, Square } from 'lucide-solid';
import { createMemo, createSignal, For, Show } from 'solid-js';

import { Icon } from '@/components/ui/icon';
import type { LevelData, LevelLayer } from '@/models/level';
import * as styles from './side-panel.css';

type SidePanelProps = {
  activeLayerId: string;
  selectedLayerId: string | null;
  level: LevelData;
  onSelectActiveLayer: (layerId: string) => void;
  onSelectLayerRect: (layerId: string, selected: boolean) => void;
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
      <Box pos={'sticky'} direction={'row'} align={'center'} gap={'xs'} top={'0'}>
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
              <LayerItem
                layer={layer}
                activeLayerId={props.activeLayerId}
                selectedLayerId={props.selectedLayerId}
                onSelectActiveLayer={props.onSelectActiveLayer}
                onSelectLayerRect={props.onSelectLayerRect}
              />
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
  selectedLayerId?: string | null;
  onSelectActiveLayer: (layerId: string) => void;
  onSelectLayerRect: (layerId: string, selected: boolean) => void;
};
const LayerItem = (props: LayerItemProps) => {
  const [expand, setExpand] = createSignal(false);
  const handleClick = () => {
    props.onSelectActiveLayer(props.layer.id);
    setExpand((prev) => !prev);
  };

  return (
    <Box as={'li'}>
      <Box direction={'row'} align={'center'} gap={'xxs'}>
        <Item
          as={Button}
          variant={'ghost'}
          media={
            <CheckBox
              checked={props.selectedLayerId === props.layer.id}
              onChecked={(checked) =>
                props.onSelectLayerRect(props.layer.id, checked)
              }
            />
          }
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
          // active={props.activeLayerId === props.layer.id}
          onClick={handleClick}
        />
      </Box>
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
