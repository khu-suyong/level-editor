import { Box, Button, Input, Item, Select } from '@suis-ui/kit';
import { Brush, Pencil, Plus, Save, Trash2, X } from 'lucide-solid';
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js';

import { Dialog } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { TilePreview } from '@/components/ui/tile-preview';
import type { CvShape, LevelData, TileIcon, TileMapping } from '@/models/level';
import {
  addPaletteTileToLevel,
  CV_SHAPE_PRESETS,
  clonePaletteTile,
  createRandomPaletteTile,
  deletePaletteTileFromLevel,
  TILE_ICON_PRESETS,
  updatePaletteTileInLevel,
  validatePaletteTileUpdate,
} from '@/stores/palette';
import * as styles from './side-panel.css';

type PaletteTabProps = {
  level: LevelData;
  selectedBrushTileId: number;
  onApplyLevel: (level: LevelData) => void;
  onSelectBrushTile: (tileId: number) => void;
};

type EditStatus = {
  type: 'error' | 'success';
  message: string;
};

const iconOptions = TILE_ICON_PRESETS.map((icon) => ({
  value: icon,
  label: icon,
}));

const shapeOptions = CV_SHAPE_PRESETS.map((shape) => ({
  value: shape,
  label: shape,
}));

const selectContentProps = { style: 'z-index: 1100' };

const getUsedTileCount = (level: LevelData, tileId: number) =>
  level.layers.reduce(
    (count, layer) =>
      count + layer.tiles.filter((tile) => tile.tileId === tileId).length,
    0,
  );

const getPaletteDescription = (level: LevelData, tile: TileMapping) => {
  const usedCount = getUsedTileCount(level, tile.tileId);
  const shapes =
    tile.cvShapes.length > 0 ? `CV: ${tile.cvShapes.join(', ')}` : 'No CV';

  return `${usedCount} placements / ${shapes}`;
};

export const PaletteTab = (props: PaletteTabProps) => {
  const [addDraft, setAddDraft] = createSignal<TileMapping | null>(null);
  const [editTargetId, setEditTargetId] = createSignal<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = createSignal<number | null>(null);
  const [replacementValue, setReplacementValue] = createSignal<string | null>(
    null,
  );
  const editTarget = createMemo(() =>
    props.level.tileTable.find((tile) => tile.tileId === editTargetId()),
  );
  const deleteTarget = createMemo(() =>
    props.level.tileTable.find((tile) => tile.tileId === deleteTargetId()),
  );
  const replacementOptions = createMemo(() =>
    props.level.tileTable
      .filter((tile) => tile.tileId !== deleteTargetId())
      .map((tile) => ({
        value: String(tile.tileId),
        label: `Tile ${tile.tileId}`,
      })),
  );
  const isOnlyTile = () => props.level.tileTable.length <= 1;
  const handleOpenAdd = () => {
    setAddDraft(createRandomPaletteTile(props.level.tileTable));
  };
  const handleCloseAdd = () => {
    setAddDraft(null);
  };
  const handleConfirmAdd = (tile: TileMapping) => {
    props.onApplyLevel(addPaletteTileToLevel(props.level, tile));
    props.onSelectBrushTile(tile.tileId);
    handleCloseAdd();
  };
  const handleOpenEdit = (tileId: number) => {
    setEditTargetId(tileId);
  };
  const handleCloseEdit = () => {
    setEditTargetId(null);
  };
  const handleConfirmEdit = (originalTileId: number, tile: TileMapping) => {
    props.onApplyLevel(
      updatePaletteTileInLevel(props.level, originalTileId, tile),
    );

    if (props.selectedBrushTileId === originalTileId) {
      props.onSelectBrushTile(tile.tileId);
    }

    handleCloseEdit();
  };
  const handleOpenDelete = (tileId: number) => {
    setDeleteTargetId(tileId);
    setReplacementValue(null);
  };
  const handleCloseDelete = () => {
    setDeleteTargetId(null);
    setReplacementValue(null);
  };
  const handleConfirmDelete = () => {
    const targetId = deleteTargetId();

    if (targetId === null) {
      return;
    }

    const replacementTileId = replacementValue()
      ? Number(replacementValue())
      : null;
    const nextLevel = deletePaletteTileFromLevel(
      props.level,
      targetId,
      replacementTileId,
    );

    props.onApplyLevel(nextLevel);

    if (props.selectedBrushTileId === targetId) {
      props.onSelectBrushTile(
        replacementTileId ?? nextLevel.tileTable[0]?.tileId ?? 0,
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
      <Box class={styles.paletteList}>
        <For each={props.level.tileTable}>
          {(tile) => (
            <PaletteTileItem
              tile={tile}
              level={props.level}
              selectedBrushTileId={props.selectedBrushTileId}
              disabledDelete={isOnlyTile()}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onSelectBrushTile={props.onSelectBrushTile}
            />
          )}
        </For>
      </Box>
      <Show when={addDraft()}>
        {(tile) => (
          <PaletteTileDialog
            open={true}
            title={'Add Tile'}
            confirmLabel={'Add Tile'}
            level={props.level}
            tile={tile()}
            originalTileId={null}
            onClose={handleCloseAdd}
            onSave={handleConfirmAdd}
          />
        )}
      </Show>
      <Show when={editTarget()}>
        {(target) => (
          <PaletteTileDialog
            open={true}
            title={`Edit Tile ${target().tileId}`}
            confirmLabel={'Save'}
            level={props.level}
            tile={target()}
            originalTileId={target().tileId}
            onClose={handleCloseEdit}
            onSave={(tile) => handleConfirmEdit(target().tileId, tile)}
          />
        )}
      </Show>
      <Show when={deleteTarget()}>
        {(target) => (
          <Dialog
            open={true}
            title={`Delete Tile ${target().tileId}`}
            description={`${getUsedTileCount(
              props.level,
              target().tileId,
            )} placements use this tile.`}
            onClose={handleCloseDelete}
            footer={
              <>
                <Button
                  variant={'ghost'}
                  size={'sm'}
                  onClick={handleCloseDelete}
                >
                  {'Cancel'}
                </Button>
                <Button
                  variant={'primary'}
                  size={'sm'}
                  onClick={handleConfirmDelete}
                >
                  {'Delete'}
                </Button>
              </>
            }
          >
            <Box gap={'sm'}>
              <Item
                size={'sm'}
                media={<TilePreview tile={target()} />}
                title={`Tile ${target().tileId}`}
                description={getPaletteDescription(props.level, target())}
              />
              <Box class={styles.field}>
                <Box as={'label'} text={'caption'} c={'text.caption'}>
                  {'Replacement'}
                </Box>
                <Select
                  value={replacementValue()}
                  onChangeValue={setReplacementValue}
                  data={replacementOptions()}
                  placeholder={'Delete placements'}
                  contentProps={selectContentProps}
                />
              </Box>
            </Box>
          </Dialog>
        )}
      </Show>
    </Box>
  );
};

type PaletteTileItemProps = {
  level: LevelData;
  disabledDelete: boolean;
  selectedBrushTileId: number;
  tile: TileMapping;
  onEdit: (tileId: number) => void;
  onDelete: (tileId: number) => void;
  onSelectBrushTile: (tileId: number) => void;
};

const PaletteTileItem = (props: PaletteTileItemProps) => (
  <Box class={styles.paletteItem}>
    <Item
      size={'sm'}
      media={<TilePreview tile={props.tile} />}
      title={`Tile ${props.tile.tileId}`}
      description={getPaletteDescription(props.level, props.tile)}
      action={
        <Box direction={'row'} gap={'xxs'}>
          <Button
            variant={'ghost'}
            type={'icon'}
            size={'sm'}
            active={props.selectedBrushTileId === props.tile.tileId}
            aria-label={`Use tile ${props.tile.tileId} brush`}
            onClick={() => props.onSelectBrushTile(props.tile.tileId)}
          >
            <Icon name={Brush} />
          </Button>
          <Button
            variant={'ghost'}
            type={'icon'}
            size={'sm'}
            aria-label={`Edit tile ${props.tile.tileId}`}
            onClick={() => props.onEdit(props.tile.tileId)}
          >
            <Icon name={Pencil} />
          </Button>
          <Button
            variant={'ghost'}
            type={'icon'}
            size={'sm'}
            aria-label={`Delete tile ${props.tile.tileId}`}
            disabled={props.disabledDelete}
            onClick={() => props.onDelete(props.tile.tileId)}
          >
            <Icon name={Trash2} />
          </Button>
        </Box>
      }
    />
  </Box>
);

type PaletteTileDialogProps = {
  open: boolean;
  title: string;
  confirmLabel: string;
  level: LevelData;
  tile: TileMapping;
  originalTileId: number | null;
  onClose: () => void;
  onSave: (tile: TileMapping) => void;
};

const PaletteTileDialog = (props: PaletteTileDialogProps) => {
  const [draft, setDraft] = createSignal<TileMapping>(
    clonePaletteTile(props.tile),
  );
  const [status, setStatus] = createSignal<EditStatus | null>(null);
  const nextAvailableShape = () =>
    CV_SHAPE_PRESETS.find((shape) => !draft().cvShapes.includes(shape)) ?? null;
  const updateDraft = (update: Partial<TileMapping>) => {
    setDraft((current) => ({
      ...current,
      ...update,
      cvShapes: update.cvShapes ?? current.cvShapes,
    }));
    setStatus(null);
  };
  const updateShape = (index: number, shape: CvShape | null) => {
    if (!shape) {
      return;
    }

    updateDraft({
      cvShapes: draft().cvShapes.map((current, currentIndex) =>
        currentIndex === index ? shape : current,
      ),
    });
  };
  const handleAddShape = () => {
    const shape = nextAvailableShape();

    if (!shape) {
      return;
    }

    updateDraft({ cvShapes: [...draft().cvShapes, shape] });
  };
  const handleRemoveShape = (index: number) => {
    updateDraft({
      cvShapes: draft().cvShapes.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    });
  };
  const handleSave = () => {
    const errors = validatePaletteTileUpdate(
      props.level,
      props.originalTileId,
      draft(),
    );

    if (errors.length > 0) {
      setStatus({
        type: 'error',
        message: errors[0],
      });
      return;
    }

    props.onSave(draft());
  };

  createEffect(() => {
    if (!props.open) {
      return;
    }

    setDraft(clonePaletteTile(props.tile));
    setStatus(null);
  });

  return (
    <Dialog
      open={props.open}
      title={props.title}
      description={
        props.originalTileId === null
          ? 'Create a palette item.'
          : getPaletteDescription(props.level, props.tile)
      }
      onClose={props.onClose}
      footer={
        <>
          <Button variant={'ghost'} size={'sm'} onClick={props.onClose}>
            {'Cancel'}
          </Button>
          <Button variant={'primary'} size={'sm'} onClick={handleSave}>
            <Icon name={Save} />
            {props.confirmLabel}
          </Button>
        </>
      }
    >
      <Box gap={'sm'}>
        <Item
          size={'sm'}
          media={<TilePreview tile={draft()} />}
          title={`Tile ${draft().tileId}`}
          description={getPaletteDescription(props.level, draft())}
        />
        <Box class={styles.formGrid}>
          <Box class={styles.field}>
            <Box as={'label'} text={'caption'} c={'text.caption'}>
              {'ID'}
            </Box>
            <Input
              type={'number'}
              min={0}
              value={String(draft().tileId)}
              onInput={(event) =>
                updateDraft({
                  tileId: Number.isNaN(event.currentTarget.valueAsNumber)
                    ? 0
                    : event.currentTarget.valueAsNumber,
                })
              }
            />
          </Box>
          <Box class={styles.field}>
            <Box as={'label'} text={'caption'} c={'text.caption'}>
              {'Icon'}
            </Box>
            <Select
              value={draft().icon}
              onChangeValue={(value: string | null) =>
                value ? updateDraft({ icon: value as TileIcon }) : undefined
              }
              data={iconOptions}
              contentProps={selectContentProps}
            />
          </Box>
          <Box class={styles.field}>
            <Box as={'label'} text={'caption'} c={'text.caption'}>
              {'Background'}
            </Box>
            <Input
              class={styles.colorInput}
              type={'color'}
              value={draft().backgroundColor}
              onInput={(event) =>
                updateDraft({ backgroundColor: event.currentTarget.value })
              }
            />
          </Box>
          <Box class={styles.field}>
            <Box as={'label'} text={'caption'} c={'text.caption'}>
              {'Icon Color'}
            </Box>
            <Input
              class={styles.colorInput}
              type={'color'}
              value={draft().iconColor}
              onInput={(event) =>
                updateDraft({ iconColor: event.currentTarget.value })
              }
            />
          </Box>
        </Box>
        <Box gap={'xs'}>
          <Item
            size={'xs'}
            title={'CV Shapes'}
            action={
              <Button
                variant={'ghost'}
                type={'icon'}
                size={'sm'}
                aria-label={'Add CV shape'}
                disabled={!nextAvailableShape()}
                onClick={handleAddShape}
              >
                <Icon name={Plus} />
              </Button>
            }
          />
          <Show
            when={draft().cvShapes.length > 0}
            fallback={
              <Box text={'caption'} c={'text.caption'} px={'xs'}>
                {'No CV shapes'}
              </Box>
            }
          >
            <For each={draft().cvShapes}>
              {(shape, index) => (
                <Box class={styles.shapeRow}>
                  <Select
                    value={shape}
                    onChangeValue={(value: string | null) =>
                      updateShape(index(), value as CvShape | null)
                    }
                    data={shapeOptions}
                    contentProps={selectContentProps}
                  />
                  <Button
                    variant={'ghost'}
                    type={'icon'}
                    size={'sm'}
                    aria-label={`Remove ${shape} shape`}
                    onClick={() => handleRemoveShape(index())}
                  >
                    <Icon name={X} />
                  </Button>
                </Box>
              )}
            </For>
          </Show>
        </Box>
        <Box
          class={styles.status}
          classList={{
            [styles.statusError]: status()?.type === 'error',
          }}
          text={'caption'}
          c={'text.caption'}
        >
          {status()?.message ?? ' '}
        </Box>
      </Box>
    </Dialog>
  );
};
