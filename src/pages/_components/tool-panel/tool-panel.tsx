import { Box, Button, Tooltip } from '@suis-ui/kit';
import {
  Eraser,
  Hand,
  MousePointer2,
  Paintbrush,
  Redo2,
  Undo2,
} from 'lucide-solid';
import { For } from 'solid-js';

import { Icon, type IconType } from '@/components/ui/icon';
import { TilePreview } from '@/components/ui/tile-preview';
import type { TileMapping } from '@/models/level';
import type { EditorTool } from '@/stores/editor';
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
  selectedBrushTileId: number;
  onRedo: () => void;
  selectedTool: EditorTool;
  tileTable: TileMapping[];
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
  return (
    <Box as={'aside'} class={styles.containerStyle}>
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
            label={'Undo'}
            disabled={!props.canUndo}
            onClick={props.onUndo}
          />
          <ToolbarIconButton
            icon={Redo2}
            label={'Redo'}
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
        aria-label={'Editor toolbar'}
      >
        <Box direction={'row'} aria-label={'Editor modes'}>
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
        aria-label={'Brush tile picker'}
      >
        <Box direction={'row'} aria-label={'Brush tiles'}>
          <For each={props.tileTable}>
            {(tile) => (
              <Tooltip
                content={<Box text={'caption'}>{`Tile ${tile.tileId}`}</Box>}
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
                    active={props.selectedBrushTileId === tile.tileId}
                    aria-label={`Use tile ${tile.tileId} brush`}
                    onClick={() => props.onSelectBrushTile(tile.tileId)}
                  >
                    <TilePreview tile={tile} size={18} />
                  </Button>
                </Box>
              </Tooltip>
            )}
          </For>
        </Box>
      </Box>
    </Box>
  );
}
