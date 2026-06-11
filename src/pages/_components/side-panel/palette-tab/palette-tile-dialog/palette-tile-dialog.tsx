import {
  Box,
  Button,
  CheckBox,
  Input,
  Select,
  SelectItem,
  type SelectItemProps,
  vars,
} from '@suis-ui/kit';
import { Plus, Save, X } from 'lucide-solid';
import { createEffect, createSignal, For, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { Dialog } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { CvShapeIconMap, TileIconMap } from '@/helpers/constants';
import type {
  CvShape,
  LevelData,
  TerrainExportTileLabels,
  TileIcon,
  TileMapping,
} from '@/models/level';
import {
  CV_SHAPE_PRESETS,
  clonePaletteTile,
  normalizeTileName,
  TILE_ICON_PRESETS,
  validatePaletteTileUpdate,
} from '@/stores/palette';
import {
  createEmptyTerrainExportTileLabels,
  TERRAIN_EXPORT_LABEL_KEYS,
} from '@/stores/terrain';
import { ColorInput } from '../color-input';
import { selectContentProps } from '../palette-tab.utils';

type EditStatus = {
  type: 'error' | 'success';
  message: string;
};

type PaletteTileDialogProps = {
  open: boolean;
  title: string;
  confirmLabel: string;
  level: LevelData;
  tile: TileMapping;
  originalTileLabel: string | null;
  onClose: () => void;
  onSave: (tile: TileMapping) => void;
};

const iconOptions = [...TILE_ICON_PRESETS];
const shapeOptions = [...CV_SHAPE_PRESETS];
const terrainExportLabelKeys = [
  'topLeft',
  'top',
  'topRight',
  'left',
  'center',
  'right',
  'bottomLeft',
  'bottom',
  'bottomRight',
] as const satisfies ReadonlyArray<keyof TerrainExportTileLabels>;
const terrainExportLabelOrder = new Map(
  terrainExportLabelKeys.map((key, index) => [key, index]),
);
const getTerrainExportLabelOrder = (key: keyof TerrainExportTileLabels) =>
  terrainExportLabelOrder.get(key) ?? Number.MAX_SAFE_INTEGER;
const sortedTerrainExportLabelKeys = [...TERRAIN_EXPORT_LABEL_KEYS].sort(
  (first, second) =>
    getTerrainExportLabelOrder(first) - getTerrainExportLabelOrder(second),
);

export const PaletteTileDialog = (props: PaletteTileDialogProps) => {
  const [draft, setDraft] = createSignal<TileMapping>(
    clonePaletteTile(props.tile),
  );
  const [status, setStatus] = createSignal<EditStatus | null>(null);
  const nextAvailableShape = () =>
    CV_SHAPE_PRESETS.find((shape) => !draft().cvShapes.includes(shape)) ?? null;
  const statusColor = () =>
    status()?.type === 'error' ? 'error.main' : 'text.caption';
  const updateDraft = (update: Partial<TileMapping>) => {
    setDraft((current) => ({
      ...current,
      ...update,
      cvShapes: update.cvShapes ?? current.cvShapes,
      isTerrain: update.isTerrain ?? current.isTerrain,
      terrainExportTileLabels:
        update.terrainExportTileLabels ?? current.terrainExportTileLabels,
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
  const terrainLabels = () =>
    draft().terrainExportTileLabels ?? createEmptyTerrainExportTileLabels();
  const updateTerrainLabel = (
    key: keyof TerrainExportTileLabels,
    value: string,
  ) => {
    updateDraft({
      terrainExportTileLabels: {
        ...terrainLabels(),
        [key]: value,
      },
    });
  };
  const toggleTerrain = (checked: boolean) => {
    updateDraft({
      isTerrain: checked,
      terrainExportTileLabels:
        draft().terrainExportTileLabels ?? createEmptyTerrainExportTileLabels(),
    });
  };
  const handleSave = () => {
    const nextTile = {
      ...clonePaletteTile(draft()),
      name: normalizeTileName(draft().name),
    };
    const errors = validatePaletteTileUpdate(
      props.level,
      props.originalTileLabel,
      nextTile,
    );

    if (errors.length > 0) {
      setStatus({
        type: 'error',
        message: errors[0],
      });
      return;
    }

    setDraft(nextTile);
    props.onSave(nextTile);
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
      onClose={props.onClose}
      footer={
        <>
          <Button variant={'ghost'} onClick={props.onClose}>
            {'취소'}
          </Button>
          <Button variant={'primary'} onClick={handleSave}>
            <Icon name={Save} />
            {props.confirmLabel}
          </Button>
        </>
      }
    >
      <Box w={'100%'} gap={'xs'}>
        <Box as={'label'} text={'caption'} c={'text.caption'}>
          {'이름'}
        </Box>
        <Input
          w={'100%'}
          value={draft().name}
          onInput={(event) => updateDraft({ name: event.currentTarget.value })}
        />
      </Box>
      <Box w={'100%'} gap={'xs'}>
        <Box as={'label'} text={'caption'} c={'text.caption'}>
          {'아이콘'}
        </Box>
        <Select
          value={draft().icon}
          onChangeValue={(value: string | null) =>
            value ? updateDraft({ icon: value as TileIcon }) : undefined
          }
          data={iconOptions}
          strategy={'fixed'}
          contentProps={selectContentProps}
          renderValue={(value: TileIcon) => (
            <Box direction={'row'} align={'center'} gap={'xs'}>
              <Dynamic component={TileIconMap[value]} size={16} />
              <Box as={'span'}>{value}</Box>
            </Box>
          )}
          renderItem={(itemProps: SelectItemProps) => (
            <SelectItem
              {...itemProps}
              media={
                <Dynamic
                  component={
                    TileIconMap[(itemProps as { value: TileIcon }).value]
                  }
                  size={16}
                />
              }
            />
          )}
        />
      </Box>
      <Box w={'100%'} gap={'xs'}>
        <Box as={'label'} text={'caption'} c={'text.caption'}>
          {'배경'}
        </Box>
        <ColorInput
          value={draft().backgroundColor}
          onInput={(value) => updateDraft({ backgroundColor: value })}
        />
      </Box>
      <Box w={'100%'} gap={'xs'}>
        <Box as={'label'} text={'caption'} c={'text.caption'}>
          {'아이콘 색상'}
        </Box>
        <ColorInput
          value={draft().iconColor}
          onInput={(value) => updateDraft({ iconColor: value })}
        />
      </Box>
      <Box w={'100%'} gap={'xs'}>
        <Box as={'label'} text={'caption'} c={'text.caption'}>
          {'표시'}
        </Box>
        <Box direction={'row'} gap={'md'} wrap={'wrap'}>
          <CheckBox
            name={'배경 표시'}
            checked={draft().showBackground}
            onChecked={(checked) => updateDraft({ showBackground: checked })}
          />
          <CheckBox
            name={'아이콘 표시'}
            checked={draft().showIcon}
            onChecked={(checked) => updateDraft({ showIcon: checked })}
          />
        </Box>
      </Box>
      <Box w={'100%'} gap={'xs'}>
        <Box as={'label'} text={'caption'} c={'text.caption'}>
          {'지형'}
        </Box>
        <CheckBox
          name={'지형 export label 사용'}
          checked={draft().isTerrain}
          onChecked={toggleTerrain}
        />
      </Box>
      <Show when={draft().isTerrain}>
        <Box w={'100%'} gap={'xs'}>
          <Box as={'label'} text={'caption'} c={'text.caption'}>
            {'Export Label'}
          </Box>
          <Box
            w={'100%'}
            gap={'xs'}
            style={{
              display: 'grid',
              'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
            }}
          >
            <For each={sortedTerrainExportLabelKeys}>
              {(key) => (
                <Box gap={'xs'} minW={'0'}>
                  <Box as={'label'} text={'caption'} c={'text.caption'}>
                    {key}
                  </Box>
                  <Input
                    w={'100%'}
                    value={terrainLabels()[key]}
                    onInput={(event) =>
                      updateTerrainLabel(key, event.currentTarget.value)
                    }
                  />
                </Box>
              )}
            </For>
          </Box>
        </Box>
      </Show>

      <Box w={'100%'} gap={'xs'}>
        <Box
          direction={'row'}
          justify={'space-between'}
          align={'center'}
          gap={'xs'}
        >
          <Box as={'label'} text={'caption'} c={'text.caption'}>
            {'매핑'}
          </Box>
          <Button
            variant={'ghost'}
            type={'icon'}
            size={'xs'}
            r={'md'}
            aria-label={'Add CV shape'}
            disabled={!nextAvailableShape()}
            onClick={handleAddShape}
          >
            <Icon name={Plus} />
          </Button>
        </Box>

        <For
          each={draft().cvShapes}
          fallback={
            <Box
              text={'caption'}
              c={'text.caption'}
              p={'md'}
              justify={'center'}
              align={'center'}
            >
              {'현재 매핑 없음'}
            </Box>
          }
        >
          {(shape, index) => (
            <Box direction={'row'} align={'center'} gap={'xs'}>
              <Select
                value={shape}
                onChangeValue={(value: string | null) =>
                  updateShape(index(), value as CvShape | null)
                }
                data={shapeOptions}
                strategy={'fixed'}
                contentProps={selectContentProps}
                renderValue={(value: CvShape) => (
                  <Box direction={'row'} align={'center'} gap={'xs'}>
                    <Dynamic component={CvShapeIconMap[value]} size={16} />
                    <Box as={'span'}>{value}</Box>
                  </Box>
                )}
                renderItem={(itemProps: SelectItemProps) => (
                  <SelectItem
                    {...itemProps}
                    media={
                      <Dynamic
                        component={
                          CvShapeIconMap[
                            (itemProps as { value: CvShape }).value
                          ]
                        }
                        size={16}
                      />
                    }
                  />
                )}
              />
              <Button
                variant={'ghost'}
                type={'icon'}
                size={'sm'}
                r={'md'}
                aria-label={`Remove ${shape} shape`}
                onClick={() => handleRemoveShape(index())}
              >
                <Icon name={X} />
              </Button>
            </Box>
          )}
        </For>
      </Box>
      <Box
        minH={vars.font.caption.lineHeight}
        text={'caption'}
        c={statusColor()}
      >
        {status()?.message ?? ' '}
      </Box>
    </Dialog>
  );
};
