import { Box, Button, Item } from '@suis-ui/kit';
import { Plus } from 'lucide-solid';
import { createMemo, createSignal, For } from 'solid-js';

import { Icon } from '@/components/ui/icon';
import type { LevelData } from '@/models/level';
import type { LayerMoveDirection } from '@/stores/layers';
import { sortLayersForDisplay } from '@/stores/layers';
import { LayerDeleteDialog } from './layer-delete-dialog';
import { LayerItem } from './layer-item';
import { LayerRenameDialog } from './layer-rename-dialog';
import { createLayerTreeFlipKey } from './layer-tab.utils';

type LayerTabProps = {
  activeLayerId: string;
  selectedLayerId: string | null;
  level: LevelData;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onMoveLayer: (layerId: string, direction: LayerMoveDirection) => void;
  onRenameLayer: (layerId: string, name: string) => string | null;
  onSelectActiveLayer: (layerId: string) => void;
  onSelectLayerRect: (layerId: string, selected: boolean) => void;
};

export const LayerTab = (props: LayerTabProps) => {
  const [deleteTargetId, setDeleteTargetId] = createSignal<string | null>(null);
  const [renameTargetId, setRenameTargetId] = createSignal<string | null>(null);
  const [expandedLayerIds, setExpandedLayerIds] = createSignal<Set<string>>(
    new Set(),
  );
  const layers = createMemo(() => sortLayersForDisplay(props.level.layers));
  const layerTreeFlipKey = createMemo(() => createLayerTreeFlipKey(layers()));
  const deleteTarget = createMemo(() =>
    props.level.layers.find((layer) => layer.id === deleteTargetId()),
  );
  const renameTarget = createMemo(() =>
    props.level.layers.find((layer) => layer.id === renameTargetId()),
  );
  const isLayerExpanded = (layerId: string) => expandedLayerIds().has(layerId);
  const toggleLayerExpanded = (layerId: string) => {
    setExpandedLayerIds((current) => {
      const next = new Set(current);

      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }

      return next;
    });
  };
  const handleCloseDelete = () => {
    setDeleteTargetId(null);
  };
  const handleCloseRename = () => {
    setRenameTargetId(null);
  };
  const handleConfirmDelete = () => {
    const targetId = deleteTargetId();

    if (!targetId) {
      return;
    }

    setExpandedLayerIds((current) => {
      const next = new Set(current);

      next.delete(targetId);

      return next;
    });
    handleCloseDelete();
    props.onDeleteLayer(targetId);
  };
  const handleSaveRename = (layerId: string, name: string) => {
    const error = props.onRenameLayer(layerId, name);

    if (!error) {
      handleCloseRename();
    }

    return error;
  };

  return (
    <Box gap={'xs'}>
      <Item
        size={'sm'}
        title={'Layers'}
        action={
          <Button
            variant={'ghost'}
            type={'icon'}
            size={'xs'}
            r={'lg'}
            onClick={props.onAddLayer}
          >
            <Icon name={Plus} />
          </Button>
        }
      />
      <Box as={'ul'} aria-label={'Layer tree'}>
        <For each={layers()}>
          {(layer, index) => (
            <LayerItem
              layer={layer}
              canMoveDown={index() < layers().length - 1}
              canMoveUp={index() > 0}
              disabledDelete={layers().length <= 1}
              expanded={isLayerExpanded(layer.id)}
              flipTrigger={layerTreeFlipKey()}
              selectedLayerId={props.selectedLayerId}
              onDeleteLayer={setDeleteTargetId}
              onMoveLayer={props.onMoveLayer}
              onRenameLayer={setRenameTargetId}
              onSelectActiveLayer={props.onSelectActiveLayer}
              onSelectLayerRect={props.onSelectLayerRect}
              onToggleExpanded={toggleLayerExpanded}
            />
          )}
        </For>
      </Box>
      <LayerDeleteDialog
        layer={deleteTarget()}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
      <LayerRenameDialog
        layer={renameTarget()}
        onClose={handleCloseRename}
        onSave={handleSaveRename}
      />
    </Box>
  );
};
