import { Box, Button, Item } from '@suis-ui/kit';
import { Plus } from 'lucide-solid';
import { createMemo, createSignal, For } from 'solid-js';

import { Icon } from '@/components/ui/icon';
import { tileLabelsEqual } from '@/helpers/tile-label';
import type { LevelData, TileMapping } from '@/models/level';
import {
  addPaletteTileToLevel,
  clonePaletteTile,
  createRandomPaletteTile,
  deletePaletteTileFromLevel,
  getTileDisplayName,
  updatePaletteTileInLevel,
} from '@/stores/palette';
import { PaletteDeleteDialog } from './palette-delete-dialog';
import {
  createReplacementOptions,
  type ReplacementOption,
} from './palette-tab.utils';
import { PaletteTileDialog } from './palette-tile-dialog';
import { PaletteTileItem } from './palette-tile-item';

type PaletteTabProps = {
  level: LevelData;
  selectedBrushTileLabel: string;
  onApplyLevel: (level: LevelData) => void;
  onSelectBrushTile: (tileLabel: string) => void;
};

export const PaletteTab = (props: PaletteTabProps) => {
  const [addOpen, setAddOpen] = createSignal(false);
  const [addDraft, setAddDraft] = createSignal<TileMapping | null>(null);
  const [editOpen, setEditOpen] = createSignal(false);
  const [editTargetLabel, setEditTargetLabel] = createSignal<string | null>(
    null,
  );
  const [editTargetSnapshot, setEditTargetSnapshot] =
    createSignal<TileMapping | null>(null);
  const [deleteOpen, setDeleteOpen] = createSignal(false);
  const [deleteTargetLabel, setDeleteTargetLabel] = createSignal<string | null>(
    null,
  );
  const [deleteTargetSnapshot, setDeleteTargetSnapshot] =
    createSignal<TileMapping | null>(null);
  const [replacementValue, setReplacementValue] = createSignal<string | null>(
    null,
  );
  const fallbackTile = createMemo(
    () =>
      props.level.tileTable[0] ??
      createRandomPaletteTile(props.level.tileTable),
  );
  const addTile = () => addDraft() ?? fallbackTile();
  const editTarget = createMemo(() =>
    props.level.tileTable.find((tile) =>
      editTargetLabel()
        ? tileLabelsEqual(tile.name, editTargetLabel() ?? '')
        : false,
    ),
  );
  const editTile = () => editTarget() ?? editTargetSnapshot() ?? fallbackTile();
  const editOriginalTileLabel = () => editTargetLabel() ?? editTile().name;
  const deleteTarget = createMemo(() =>
    props.level.tileTable.find((tile) =>
      deleteTargetLabel()
        ? tileLabelsEqual(tile.name, deleteTargetLabel() ?? '')
        : false,
    ),
  );
  const deleteTile = () =>
    deleteTarget() ?? deleteTargetSnapshot() ?? fallbackTile();
  const replacementOptions = createMemo<ReplacementOption[]>(() =>
    createReplacementOptions(props.level, deleteTargetLabel()),
  );
  const isOnlyTile = () => props.level.tileTable.length <= 1;
  const handleOpenAdd = () => {
    setAddDraft(createRandomPaletteTile(props.level.tileTable));
    setAddOpen(true);
  };
  const handleCloseAdd = () => {
    setAddOpen(false);
  };
  const handleConfirmAdd = (tile: TileMapping) => {
    props.onApplyLevel(addPaletteTileToLevel(props.level, tile));
    props.onSelectBrushTile(tile.name);
    handleCloseAdd();
  };
  const handleOpenEdit = (tileLabel: string) => {
    const target = props.level.tileTable.find((tile) =>
      tileLabelsEqual(tile.name, tileLabel),
    );

    setEditTargetLabel(tileLabel);

    if (target) {
      setEditTargetSnapshot(clonePaletteTile(target));
    }

    setEditOpen(true);
  };
  const handleCloseEdit = () => {
    setEditOpen(false);
  };
  const handleConfirmEdit = (originalTileLabel: string, tile: TileMapping) => {
    props.onApplyLevel(
      updatePaletteTileInLevel(props.level, originalTileLabel, tile),
    );

    if (tileLabelsEqual(props.selectedBrushTileLabel, originalTileLabel)) {
      props.onSelectBrushTile(tile.name);
    }

    handleCloseEdit();
  };
  const handleOpenDelete = (tileLabel: string) => {
    const target = props.level.tileTable.find((tile) =>
      tileLabelsEqual(tile.name, tileLabel),
    );

    setDeleteTargetLabel(tileLabel);
    setReplacementValue(null);

    if (target) {
      setDeleteTargetSnapshot(clonePaletteTile(target));
    }

    setDeleteOpen(true);
  };
  const handleCloseDelete = () => {
    setDeleteOpen(false);
  };
  const handleConfirmDelete = () => {
    const targetLabel = deleteTargetLabel();

    if (targetLabel === null) {
      return;
    }

    const replacementTileLabel = replacementValue();
    const nextLevel = deletePaletteTileFromLevel(
      props.level,
      targetLabel,
      replacementTileLabel,
    );

    props.onApplyLevel(nextLevel);

    if (tileLabelsEqual(props.selectedBrushTileLabel, targetLabel)) {
      props.onSelectBrushTile(
        replacementTileLabel ?? nextLevel.tileTable[0]?.name ?? 'Tile 0',
      );
    }

    handleCloseDelete();
  };

  return (
    <Box gap={'sm'}>
      <Item
        size={'sm'}
        title={'Palette'}
        action={
          <Button variant={'primary'} size={'sm'} onClick={handleOpenAdd}>
            <Icon name={Plus} />
            {'Add Tile'}
          </Button>
        }
      />
      <Box gap={'sm'}>
        <For each={props.level.tileTable}>
          {(tile) => (
            <PaletteTileItem
              tile={tile}
              level={props.level}
              disabledDelete={isOnlyTile()}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          )}
        </For>
      </Box>
      <PaletteTileDialog
        open={addOpen()}
        title={'타일 추가'}
        confirmLabel={'타일 추가'}
        level={props.level}
        tile={addTile()}
        originalTileLabel={null}
        onClose={handleCloseAdd}
        onSave={handleConfirmAdd}
      />
      <PaletteTileDialog
        open={editOpen() && Boolean(editTarget())}
        title={`${getTileDisplayName(editTile())} 수정`}
        confirmLabel={'저장'}
        level={props.level}
        tile={editTile()}
        originalTileLabel={editOriginalTileLabel()}
        onClose={handleCloseEdit}
        onSave={(tile) => handleConfirmEdit(editOriginalTileLabel(), tile)}
      />
      <PaletteDeleteDialog
        open={deleteOpen() && Boolean(deleteTarget())}
        level={props.level}
        replacementOptions={replacementOptions()}
        replacementValue={replacementValue()}
        tile={deleteTile()}
        onChangeReplacement={setReplacementValue}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};
