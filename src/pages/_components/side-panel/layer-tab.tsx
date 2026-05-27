import { Box, Button, CheckBox, Item, Tooltip } from '@suis-ui/kit';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Plus,
  Square,
  Trash2,
} from 'lucide-solid';
import { createMemo, createSignal, For, Show } from 'solid-js';

import { Dialog } from '@/components/ui/dialog';
import type { IconType } from '@/components/ui/icon';
import { Icon } from '@/components/ui/icon';
import type { LevelData, LevelLayer, TileMapping } from '@/models/level';
import type { LayerMoveDirection } from '@/stores/layers';
import { sortLayersForDisplay } from '@/stores/layers';
import { createDefaultTileName, getTileDisplayName } from '@/stores/palette';
import * as styles from './side-panel.css';

type LayerTabProps = {
  activeLayerId: string;
  selectedLayerId: string | null;
  level: LevelData;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onMoveLayer: (layerId: string, direction: LayerMoveDirection) => void;
  onSelectActiveLayer: (layerId: string) => void;
  onSelectLayerRect: (layerId: string, selected: boolean) => void;
};

export const LayerTab = (props: LayerTabProps) => {
  const [deleteTargetId, setDeleteTargetId] = createSignal<string | null>(null);
  const layers = createMemo(() => sortLayersForDisplay(props.level.layers));
  const deleteTarget = createMemo(() =>
    props.level.layers.find((layer) => layer.id === deleteTargetId()),
  );
  const handleCloseDelete = () => {
    setDeleteTargetId(null);
  };
  const handleConfirmDelete = () => {
    const targetId = deleteTargetId();

    if (!targetId) {
      return;
    }

    props.onDeleteLayer(targetId);
    handleCloseDelete();
  };

  return (
    <Box gap={'xs'}>
      <Item
        size={'sm'}
        title={'Layers'}
        action={
          <Button variant={'primary'} size={'sm'} onClick={props.onAddLayer}>
            <Icon name={Plus} />
            {'Add Layer'}
          </Button>
        }
      />
      <Box as={'ul'} aria-label={'Layer tree'}>
        <For each={layers()}>
          {(layer, index) => (
            <LayerItem
              layer={layer}
              tileTable={props.level.tileTable}
              activeLayerId={props.activeLayerId}
              canMoveDown={index() < layers().length - 1}
              canMoveUp={index() > 0}
              disabledDelete={layers().length <= 1}
              selectedLayerId={props.selectedLayerId}
              onDeleteLayer={setDeleteTargetId}
              onMoveLayer={props.onMoveLayer}
              onSelectActiveLayer={props.onSelectActiveLayer}
              onSelectLayerRect={props.onSelectLayerRect}
            />
          )}
        </For>
      </Box>
      <Dialog
        open={Boolean(deleteTarget())}
        title={`${deleteTarget()?.name ?? 'Layer'} 삭제 확인`}
        description={`${deleteTarget()?.tiles.length ?? 0}개의 타일이 포함된 레이어를 삭제합니다.`}
        onClose={handleCloseDelete}
        footer={
          <>
            <Button variant={'ghost'} onClick={handleCloseDelete}>
              {'취소'}
            </Button>
            <Button variant={'primary'} onClick={handleConfirmDelete}>
              {'삭제'}
            </Button>
          </>
        }
      >
        <Show when={deleteTarget()}>
          {(layer) => (
            <Item
              size={'sm'}
              title={layer().name}
              description={`${layer().id} / order ${layer().order}`}
            />
          )}
        </Show>
      </Dialog>
    </Box>
  );
};

type LayerItemProps = {
  canMoveDown: boolean;
  canMoveUp: boolean;
  disabledDelete: boolean;
  layer: LevelLayer;
  tileTable: TileMapping[];
  activeLayerId?: string;
  selectedLayerId?: string | null;
  onDeleteLayer: (layerId: string) => void;
  onMoveLayer: (layerId: string, direction: LayerMoveDirection) => void;
  onSelectActiveLayer: (layerId: string) => void;
  onSelectLayerRect: (layerId: string, selected: boolean) => void;
};

type LayerActionButtonProps = {
  disabled?: boolean;
  icon: IconType;
  label: string;
  onClick: () => void;
};

const LayerActionButton = (props: LayerActionButtonProps) => (
  <Tooltip
    content={<Box text={'caption'}>{props.label}</Box>}
    placement={'top'}
    withArrow
    offset={8}
  >
    <Box as={'span'} direction={'row'}>
      <Button
        variant={'ghost'}
        type={'icon'}
        size={'sm'}
        aria-label={props.label}
        disabled={props.disabled}
        onClick={(event) => {
          event.stopPropagation();
          props.onClick();
        }}
      >
        <Icon name={props.icon} />
      </Button>
    </Box>
  </Tooltip>
);

const LayerItem = (props: LayerItemProps) => {
  const [expand, setExpand] = createSignal(false);
  const tileNameById = createMemo(
    () =>
      new Map(
        props.tileTable.map((tile) => [tile.tileId, getTileDisplayName(tile)]),
      ),
  );
  const getTileName = (tileId: number) =>
    tileNameById().get(tileId) ?? createDefaultTileName(tileId);
  const handleClick = () => {
    props.onSelectActiveLayer(props.layer.id);
    setExpand((prev) => !prev);
  };

  return (
    <Box as={'li'}>
      <Box direction={'row'} align={'center'} gap={'xxs'}>
        <Item
          as={Button}
          flex
          variant={'ghost'}
          active={props.activeLayerId === props.layer.id}
          media={
            <Box
              as={'span'}
              onClick={(event: MouseEvent) => event.stopPropagation()}
            >
              <CheckBox
                checked={props.selectedLayerId === props.layer.id}
                onChecked={(checked) =>
                  props.onSelectLayerRect(props.layer.id, checked)
                }
              />
            </Box>
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
          onClick={handleClick}
        />
        <Box direction={'row'} gap={'xxs'}>
          <LayerActionButton
            icon={ArrowUp}
            label={`Move ${props.layer.name} up`}
            disabled={!props.canMoveUp}
            onClick={() => props.onMoveLayer(props.layer.id, 'up')}
          />
          <LayerActionButton
            icon={ArrowDown}
            label={`Move ${props.layer.name} down`}
            disabled={!props.canMoveDown}
            onClick={() => props.onMoveLayer(props.layer.id, 'down')}
          />
          <LayerActionButton
            icon={Trash2}
            label={`Delete ${props.layer.name}`}
            disabled={props.disabledDelete}
            onClick={() => props.onDeleteLayer(props.layer.id)}
          />
        </Box>
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
                    <Box as={'span'}>{getTileName(tile.tileId)}</Box>
                    <Box
                      as={'span'}
                      text={'caption'}
                      c={'text.caption'}
                    >{`#${tile.tileId} / ${tile.x}, ${tile.y}`}</Box>
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
