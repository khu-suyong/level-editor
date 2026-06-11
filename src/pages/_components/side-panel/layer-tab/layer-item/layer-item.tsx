import { Box, Button, Item } from '@suis-ui/kit';
import {
  ChevronDown,
  ChevronUp,
  EllipsisVertical,
  Pencil,
  Square,
  Trash2,
} from 'lucide-solid';
import { Flip } from 'solid-flip';
import { For } from 'solid-js';

import { Icon } from '@/components/ui/icon';
import { MenuButton } from '@/components/ui/menu-button';
import type { LevelLayer } from '@/models/level';
import type { LayerMoveDirection } from '@/stores/layers';
import * as styles from '../layer-tab.css';
import { getTileFlipId } from '../layer-tab.utils';

type LayerItemProps = {
  canMoveDown: boolean;
  canMoveUp: boolean;
  disabledDelete: boolean;
  expanded: boolean;
  flipTrigger: string;
  layer: LevelLayer;
  selectedLayerId?: string | null;
  onDeleteLayer: (layerId: string) => void;
  onMoveLayer: (layerId: string, direction: LayerMoveDirection) => void;
  onRenameLayer: (layerId: string) => void;
  onSelectActiveLayer: (layerId: string) => void;
  onSelectLayerRect: (layerId: string, selected: boolean) => void;
  onToggleExpanded: (layerId: string) => void;
};

export const LayerItem = (props: LayerItemProps) => (
  <Flip
    id={`side-panel-layer-${props.layer.id}`}
    with={props.flipTrigger}
    properties={['translate', 'opacity']}
  >
    <Box as={'li'}>
      <Box direction={'row'} align={'center'} gap={'xxs'}>
        <Box>
          <Button
            variant={'ghost'}
            type={'icon'}
            size={'xs'}
            disabled={!props.canMoveUp}
            aria-label={'레이어 위로 이동'}
            onClick={() => props.onMoveLayer(props.layer.id, 'up')}
          >
            <Icon name={ChevronUp} size={12} />
          </Button>
          <Button
            variant={'ghost'}
            type={'icon'}
            size={'xs'}
            disabled={!props.canMoveDown}
            aria-label={'레이어 아래로 이동'}
            onClick={() => props.onMoveLayer(props.layer.id, 'down')}
          >
            <Icon name={ChevronDown} size={12} />
          </Button>
        </Box>
        <Item
          as={Button}
          flex
          variant={'ghost'}
          active={props.selectedLayerId === props.layer.id}
          onClick={() =>
            props.onSelectLayerRect(
              props.layer.id,
              props.selectedLayerId !== props.layer.id,
            )
          }
          title={
            <Box
              direction={'row'}
              justify={'flex-start'}
              align={'center'}
              gap={'xs'}
            >
              <Box as={'span'}>{props.layer.name}</Box>
            </Box>
          }
          description={props.layer.id}
        />
        <Button
          variant={'ghost'}
          type={'icon'}
          size={'xs'}
          r={'sm'}
          aria-label={props.expanded ? '레이어 접기' : '레이어 펼치기'}
          onClick={(event) => {
            props.onSelectActiveLayer(props.layer.id);
            props.onToggleExpanded(props.layer.id);
            event.stopPropagation();
          }}
        >
          <Icon name={props.expanded ? ChevronUp : ChevronDown} />
        </Button>
        <MenuButton
          variant={'ghost'}
          type={'icon'}
          size={'xs'}
          r={'sm'}
          aria-label={'레이어 메뉴'}
          items={[
            {
              label: '레이어 이름 변경',
              icon: Pencil,
              onClick: () => props.onRenameLayer(props.layer.id),
            },
            {
              label: '레이어 삭제',
              disabled: props.disabledDelete,
              icon: Trash2,
              onClick: () => props.onDeleteLayer(props.layer.id),
            },
          ]}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <Icon name={EllipsisVertical} />
        </MenuButton>
      </Box>
      <Box
        aria-hidden={!props.expanded}
        class={styles.tileCollapse({ expanded: props.expanded })}
      >
        <Box class={styles.tileCollapseInner}>
          <Box as={'ul'} pl={'md'}>
            <For each={props.layer.tiles}>
              {(tile) => (
                <Flip
                  id={getTileFlipId(props.layer.id, tile)}
                  with={props.flipTrigger}
                  properties={['translate', 'opacity']}
                >
                  <Box as={'li'} class={styles.tileNode}>
                    <Item
                      class={styles.tileItem}
                      c={'text.caption'}
                      media={<Icon name={Square} />}
                      title={
                        <Box
                          direction={'row'}
                          justify={'flex-start'}
                          align={'center'}
                          gap={'xs'}
                        >
                          <Box
                            as={'span'}
                            text={'caption'}
                            c={'text.caption'}
                          >{`${tile.tileLabel} / ${tile.x}, ${tile.y}`}</Box>
                        </Box>
                      }
                      justify={'flex-start'}
                    />
                  </Box>
                </Flip>
              )}
            </For>
          </Box>
        </Box>
      </Box>
    </Box>
  </Flip>
);
