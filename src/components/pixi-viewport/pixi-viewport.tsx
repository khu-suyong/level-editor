import { useStore } from '@nanostores/solid';
import { Box, Button, Popup } from '@suis-ui/kit';
import { createSignal } from 'solid-js';
import type { Cell, LevelData } from '@/models/level';
import { editorStore, setZoom } from '@/stores/editor';
import type { EditorHistoryAction } from '@/stores/history';
import * as styles from './pixi-viewport.css';
import type { ContextMenuState, SelectionRect } from './types';
import { usePixiEditorActions } from './use-pixi-editor-actions';
import { usePixiScene } from './use-pixi-scene';
import { usePixiViewportInput } from './use-pixi-viewport-input';

export type PixiViewportProps = {
  snapshot: LevelData;
  onAction: (action: EditorHistoryAction) => void;
};

export const PixiViewport = (props: PixiViewportProps) => {
  let host!: HTMLDivElement;

  const editor = useStore(editorStore);
  const [hoverCell, setHoverCell] = createSignal<Cell | null>(null);
  const [contextMenu, setContextMenu] = createSignal<ContextMenuState>({
    open: false,
    pointerX: 0,
    pointerY: 0,
    cell: { x: 0, y: 0 },
  });
  const [dragDelta, setDragDelta] = createSignal<Cell | null>(null);
  const [selectionRect, setSelectionRect] = createSignal<SelectionRect | null>(
    null,
  );
  const [isPanning, setIsPanning] = createSignal(false);

  const activeLayerId = () => editor().activeLayerId;
  const clipboard = () => editor().clipboard;
  const selectedTool = () => editor().selectedTool;
  const selection = () => editor().selection;
  const snapshot = () => props.snapshot;
  const zoom = () => editor().zoom;
  const getHost = () => host;
  const isDeleteDisabled = () => {
    if (selection().length > 0) {
      return false;
    }

    const menu = contextMenu();

    return menu ? !actions.findTileAt(menu.cell) : false;
  };

  const actions = usePixiEditorActions({
    activeLayerId,
    clipboard,
    onAction: props.onAction,
    selection,
    snapshot,
  });
  const sceneApi = usePixiScene({
    activeLayerId,
    clipboard,
    contextMenu,
    dragDelta,
    getActiveTiles: actions.getActiveTiles,
    getHost,
    hoverCell,
    selection,
    selectionRect,
    setZoom,
    snapshot,
    zoom,
  });
  const input = usePixiViewportInput({
    actions,
    contextMenu,
    dragDelta,
    getHost,
    hoverCell,
    scene: sceneApi.scene,
    sceneApi,
    selectedTool,
    selection,
    setContextMenu,
    setDragDelta,
    setHoverCell,
    setIsPanning,
    setSelectionRect,
    setZoom,
    zoom,
  });

  return (
    <>
      <div
        ref={host}
        class={styles.viewport}
        classList={{
          [styles.isPanTool]: selectedTool() === 'pan',
          [styles.isPanning]: isPanning(),
        }}
      />
      <Popup
        open={contextMenu().open}
        placement={'bottom-start'}
        element={
          <Box
            as={'ul'}
            role={'menu'}
            align={'stretch'}
            bg={'surface.main'}
            bw={'md'}
            bc={'surface.high'}
            p={'xs'}
            gap={'xs'}
            r={'lg'}
          >
            <Box as={'li'} role={'presentation'}>
              {`${contextMenu().cell.x}, ${contextMenu().cell.y}`}
            </Box>
            <Box as={'li'} role={'none'}>
              <Button
                w={'100%'}
                type={'button'}
                variant={'ghost'}
                role={'menuitem'}
                disabled={selection().length === 0}
                onClick={input.handleMenuCopy}
              >
                {'Copy'}
              </Button>
            </Box>
            <Box as={'li'} role={'none'}>
              <Button
                w={'100%'}
                type={'button'}
                variant={'ghost'}
                role={'menuitem'}
                disabled={!clipboard()}
                onClick={input.handleMenuPaste}
              >
                {'Paste'}
              </Button>
            </Box>
            <Box as={'li'} role={'none'}>
              <Button
                w={'100%'}
                type={'button'}
                variant={'ghost'}
                role={'menuitem'}
                disabled={isDeleteDisabled()}
                onClick={input.handleMenuDelete}
              >
                {'Delete'}
              </Button>
            </Box>
            <Box as={'li'} role={'none'}>
              <Button
                w={'100%'}
                type={'button'}
                variant={'ghost'}
                role={'menuitem'}
                disabled={selection().length === 0}
                onClick={input.handleClearSelection}
              >
                {'Clear Selection'}
              </Button>
            </Box>
            <Box as={'li'} role={'none'}>
              <Button
                w={'100%'}
                type={'button'}
                variant={'ghost'}
                role={'menuitem'}
                onClick={input.handleResetView}
              >
                {'Reset View'}
              </Button>
            </Box>
          </Box>
        }
      >
        <div
          class={styles.contextMenu}
          style={{
            left: `${contextMenu().pointerX}px`,
            top: `${contextMenu().pointerY}px`,
          }}
        />
      </Popup>
    </>
  );
};
