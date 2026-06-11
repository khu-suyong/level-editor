import { Box, Button, Tooltip, vars } from '@suis-ui/kit';
import { Plus, Redo2, Undo2 } from 'lucide-solid';
import { Flip } from 'solid-flip';
import { For, Show } from 'solid-js';

import {
  editorToolShortcutActionIds,
  getShortcutAriaKeys,
  getShortcutDisplay,
  shortcutById,
} from '@/helpers/editor-shortcuts';
import { tileLabelsEqual } from '@/helpers/tile-label';
import type { TileMapping } from '@/models/level';
import { TilePreview } from '@/pages/_components/tile-preview';
import type { EditorTool } from '@/stores/editor';
import { getTileDisplayName } from '@/stores/palette';
import { tools } from './tool-panel.constants';
import * as styles from './tool-panel.css';
import { ToolbarIconButton } from './toolbar-icon-button';

type ToolPanelProps = {
  canRedo: boolean;
  canUndo: boolean;
  recognitionImportPending: boolean;
  selectedBrushTileLabel: string;
  onRedo: () => void;
  selectedTool: EditorTool;
  tileTable: TileMapping[];
  onOpenRecognitionImage: () => void;
  onUndo: () => void;
  onSelectBrushTile: (tileLabel: string) => void;
  onSelectTool: (selectedTool: EditorTool) => void;
};

export function ToolPanel(props: ToolPanelProps) {
  return (
    <Box
      as={'aside'}
      class={styles.containerStyle}
      pos={'fixed'}
      z={10}
      left={'50%'}
      bottom={vars.size.space.lg}
      direction={'row'}
      justify={'center'}
      align={'center'}
      gap={'sm'}
    >
      <Flip
        id={'toolbar-history-actions'}
        with={props.selectedTool}
        properties={'translate'}
      >
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
              shortcut={getShortcutDisplay(shortcutById.undo)}
              ariaKeyShortcuts={getShortcutAriaKeys(shortcutById.undo)}
            />
            <ToolbarIconButton
              icon={Redo2}
              label={'다시 실행'}
              disabled={!props.canRedo}
              onClick={props.onRedo}
              shortcut={getShortcutDisplay(shortcutById.redo)}
              ariaKeyShortcuts={getShortcutAriaKeys(shortcutById.redo)}
            />
          </Box>
        </Box>
      </Flip>

      <Flip
        id={'toolbar-recognition-action'}
        with={props.selectedTool}
        properties={'translate'}
      >
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
            onClick={props.onOpenRecognitionImage}
            shortcut={getShortcutDisplay(shortcutById['import-recognition'])}
            ariaKeyShortcuts={getShortcutAriaKeys(
              shortcutById['import-recognition'],
            )}
          />
        </Box>
      </Flip>

      <Flip
        id={'toolbar-editor-tools'}
        with={props.selectedTool}
        properties={'translate'}
      >
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
                  shortcut={getShortcutDisplay(
                    shortcutById[editorToolShortcutActionIds[tool.id]],
                  )}
                  ariaKeyShortcuts={getShortcutAriaKeys(
                    shortcutById[editorToolShortcutActionIds[tool.id]],
                  )}
                />
              )}
            </For>
          </Box>
        </Box>
      </Flip>

      <Show
        when={props.selectedTool === 'brush' || props.selectedTool === 'fill'}
      >
        <Flip
          id={'toolbar-brush-palette'}
          with={props.selectedTool}
          preserve={'all'}
          enter={styles.paletteGroupEnterStyle}
          exit={styles.paletteGroupExitStyle}
        >
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
            aria-label={'타일 선택기'}
          >
            <Box direction={'row'} aria-label={'타일'}>
              <For each={props.tileTable}>
                {(tile) => (
                  <Tooltip
                    content={getTileDisplayName(tile)}
                    placement={'top'}
                    withArrow
                    offset={12}
                  >
                    <Button
                      variant={'ghost'}
                      size={'md'}
                      p={'none'}
                      type={'icon'}
                      aria-label={`Use ${getTileDisplayName(tile)} tile`}
                      onClick={() => props.onSelectBrushTile(tile.name)}
                      style={{
                        opacity: tileLabelsEqual(
                          props.selectedBrushTileLabel,
                          tile.name,
                        )
                          ? 1
                          : 0.25,
                      }}
                    >
                      <TilePreview tile={tile} size={16} />
                    </Button>
                  </Tooltip>
                )}
              </For>
            </Box>
          </Box>
        </Flip>
      </Show>
    </Box>
  );
}
