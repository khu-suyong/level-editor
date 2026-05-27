import { Box, Button, Tooltip } from '@suis-ui/kit';
import {
  Eraser,
  Hand,
  MousePointer2,
  Paintbrush,
  Plus,
  Redo2,
  Undo2,
} from 'lucide-solid';
import { For, type JSX } from 'solid-js';

import { Icon, type IconType } from '@/components/ui/icon';
import type { TileMapping } from '@/models/level';
import { TilePreview } from '@/pages/_components/tile-preview';
import type { EditorTool } from '@/stores/editor';
import { getTileDisplayName } from '@/stores/palette';
import * as styles from './tool-panel.css';

const tools = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'brush', label: 'Brush', icon: Paintbrush },
  { id: 'erase', label: 'Erase', icon: Eraser },
  { id: 'pan', label: 'Pan', icon: Hand },
] as const satisfies ReadonlyArray<{
  id: EditorTool;
  label: string;
  icon: IconType;
}>;

type ToolPanelProps = {
  canRedo: boolean;
  canUndo: boolean;
  recognitionImportPending: boolean;
  selectedBrushTileId: number;
  onRedo: () => void;
  selectedTool: EditorTool;
  tileTable: TileMapping[];
  onImportRecognitionImage: (file: File) => void;
  onUndo: () => void;
  onSelectBrushTile: (tileId: number) => void;
  onSelectTool: (selectedTool: EditorTool) => void;
};

type ToolbarIconButtonProps = {
  active?: boolean;
  disabled?: boolean;
  icon: IconType;
  label: string;
  onClick: () => void;
};

const ToolbarIconButton = (props: ToolbarIconButtonProps) => (
  <Tooltip
    content={<Box text={'caption'}>{props.label}</Box>}
    placement={'top'}
    withArrow
    offset={12}
  >
    <Box as={'span'} direction={'row'}>
      <Button
        variant={'ghost'}
        size={'md'}
        p={'sm'}
        type={'icon'}
        active={props.active}
        disabled={props.disabled}
        aria-label={props.label}
        onClick={props.onClick}
      >
        <Icon name={props.icon} />
      </Button>
    </Box>
  </Tooltip>
);

export function ToolPanel(props: ToolPanelProps) {
  let recognitionImageInput: HTMLInputElement | undefined;
  const handleOpenRecognitionImageInput = () => {
    recognitionImageInput?.click();
  };
  const handleRecognitionImageChange: JSX.EventHandler<
    HTMLInputElement,
    Event
  > = (event) => {
    const file = event.currentTarget.files?.[0] ?? null;

    event.currentTarget.value = '';

    if (!file) {
      return;
    }

    props.onImportRecognitionImage(file);
  };

  return (
    <Box as={'aside'} class={styles.containerStyle}>
      <input
        ref={(element) => {
          recognitionImageInput = element;
        }}
        type={'file'}
        accept={'image/*'}
        aria-label={'Recognition image file'}
        hidden
        onChange={handleRecognitionImageChange}
      />

      <Box
        class={styles.groupStyle}
        direction={'row'}
        p={'xs'}
        gap={'sm'}
        r={'md'}
        bg={'surface.high'}
        bc={'surface.higher'}
        bd={'thin'}
        shadow={'md'}
        aria-label={'Editor toolbar'}
      >
        <Box direction={'row'} aria-label={'History actions'}>
          <ToolbarIconButton
            icon={Undo2}
            label={'실행 취소'}
            disabled={!props.canUndo}
            onClick={props.onUndo}
          />
          <ToolbarIconButton
            icon={Redo2}
            label={'다시 실행'}
            disabled={!props.canRedo}
            onClick={props.onRedo}
          />
        </Box>
      </Box>

      <Box
        class={styles.groupStyle}
        direction={'row'}
        p={'xs'}
        gap={'sm'}
        r={'md'}
        bg={'surface.high'}
        bc={'surface.higher'}
        bd={'thin'}
        shadow={'md'}
        aria-label={'이미지 인식'}
      >
        <ToolbarIconButton
          icon={Plus}
          label={'이미지 인식'}
          disabled={props.recognitionImportPending}
          onClick={handleOpenRecognitionImageInput}
        />
      </Box>

      <Box
        class={styles.groupStyle}
        direction={'row'}
        p={'xs'}
        gap={'sm'}
        r={'md'}
        bg={'surface.high'}
        bc={'surface.higher'}
        bd={'thin'}
        shadow={'md'}
        aria-label={'에디터 도구 모음'}
      >
        <Box direction={'row'} aria-label={'에디터 모드'}>
          <For each={tools}>
            {(tool) => (
              <ToolbarIconButton
                icon={tool.icon}
                label={tool.label}
                active={props.selectedTool === tool.id}
                onClick={() => props.onSelectTool(tool.id)}
              />
            )}
          </For>
        </Box>
      </Box>

      <Box
        class={styles.groupStyle}
        direction={'row'}
        p={'xs'}
        gap={'sm'}
        r={'md'}
        bg={'surface.high'}
        bc={'surface.higher'}
        bd={'thin'}
        shadow={'md'}
        aria-label={'브러시 타일 선택기'}
      >
        <Box direction={'row'} aria-label={'브러시 타일'}>
          <For each={props.tileTable}>
            {(tile) => (
              <Tooltip
                content={<Box text={'caption'}>{getTileDisplayName(tile)}</Box>}
                placement={'top'}
                withArrow
                offset={12}
              >
                <Button
                  variant={'ghost'}
                  size={'md'}
                  p={'none'}
                  type={'icon'}
                  aria-label={`Use ${getTileDisplayName(tile)} brush`}
                  onClick={() => props.onSelectBrushTile(tile.tileId)}
                  style={{
                    opacity: props.selectedBrushTileId !== tile.tileId ? 0.25 : 1,
                  }}
                >
                  <TilePreview tile={tile} size={16} />
                </Button>
              </Tooltip>
            )}
          </For>
        </Box>
      </Box>
    </Box>
  );
}
