import { useStore } from '@nanostores/solid';
import { Box, Item, Popup, vars } from '@suis-ui/kit';
import {
  ClipboardPaste,
  Copy,
  RefreshCcw,
  SquareDashedMousePointer,
  Trash2,
} from 'lucide-solid';
import { createSignal } from 'solid-js';
import type { Cell, LevelData } from '@/models/level';
import { editorStore, setZoom } from '@/stores/editor';
import { Icon } from '../ui/icon';
import * as styles from './pixi-viewport.css';
import type {
  ContextMenuState,
  LayerMoveState,
  LayerResizeState,
  SelectionRect,
} from './types';
import { usePixiEditorActions } from './use-pixi-editor-actions';
import { usePixiScene } from './use-pixi-scene';
import { usePixiViewportInput } from './use-pixi-viewport-input';

export type PixiViewportProps = {
  snapshot: LevelData;
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
  const [erasePreviewCells, setErasePreviewCells] = createSignal<Cell[]>([]);
  const [paintPreviewCells, setPaintPreviewCells] = createSignal<Cell[]>([]);
  const [selectionRect, setSelectionRect] = createSignal<SelectionRect | null>(
    null,
  );
  const [layerResizePreview, setLayerResizePreview] =
    createSignal<LayerResizeState | null>(null);
  const [layerMovePreview, setLayerMovePreview] =
    createSignal<LayerMoveState | null>(null);
  const [isPanning, setIsPanning] = createSignal(false);
  const [isMovingSelection, setIsMovingSelection] = createSignal(false);

  const activeLayerId = () => editor().activeLayerId;
  const clipboard = () => editor().clipboard;
  const selectedTileId = () => editor().selectedTileId;
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
  const isHoveringSelection = () => {
    const cell = hoverCell();

    return (
      selectedTool() === 'select' &&
      !isMovingSelection() &&
      !!cell &&
      selection().some((tile) => tile.x === cell.x && tile.y === cell.y)
    );
  };

  const actions = usePixiEditorActions({
    activeLayerId,
    clipboard,
    selection,
    selectedTileId,
    snapshot,
  });
  const sceneApi = usePixiScene({
    activeLayerId,
    brushTileId: actions.getBrushTileId,
    clipboard,
    contextMenu,
    dragDelta,
    erasePreviewCells,
    getHost,
    hoverCell,
    layerMovePreview,
    layerResizePreview,
    paintPreviewCells,
    selectedTool,
    selection,
    selectionRect,
    setZoom,
    snapshot,
    zoom,
  });
  const input = usePixiViewportInput({
    actions,
    contextMenu,
    getHost,
    hoverCell,
    scene: sceneApi.scene,
    sceneApi,
    selectedTool,
    selection,
    setContextMenu,
    setDragDelta,
    setErasePreviewCells,
    setHoverCell,
    setIsMovingSelection,
    setIsPanning,
    setLayerMovePreview,
    setLayerResizePreview,
    setPaintPreviewCells,
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
          [styles.isSelectionDraggable]: isHoveringSelection(),
          [styles.isSelectionDragging]: isMovingSelection(),
        }}
      />
      <Popup
        open={contextMenu().open}
        placement={'bottom-start'}
        element={
          <Box
            minW={'20rem'}
            as={'ul'}
            role={'menu'}
            align={'stretch'}
            bg={'surface.main'}
            bw={'md'}
            bc={'surface.high'}
            r={'md'}
            class={styles.contextMenuPanel}
            style={{ 'box-shadow': vars.shadow.lg }}
          >
            <Item
              as={'li'}
              role={'presentation'}
              class={styles.contextMenuGroup}
              title={'선택된 셀'}
              description={`${contextMenu().cell.x}, ${contextMenu().cell.y}`}
              size={'sm'}
            />
            <Box as={'li'} class={styles.contextMenuGroup} role={'none'}>
              <Box as={'ul'} role={'none'} class={styles.contextMenuList}>
                <Box as={'li'} role={'none'}>
                  <Item
                    as={'button'}
                    type={'button'}
                    media={<Icon name={Copy} />}
                    title={'복사'}
                    action={'⌘C'}
                    size={'sm'}
                    w={'100%'}
                    bg={'surface.main'}
                    c={'text.main'}
                    role={'menuitem'}
                    disabled={selection().length === 0}
                    onClick={input.handleMenuCopy}
                  />
                </Box>
                <Box as={'li'} role={'none'}>
                  <Item
                    as={'button'}
                    type={'button'}
                    media={<Icon name={ClipboardPaste} />}
                    title={'붙여넣기'}
                    action={'⌘V'}
                    size={'sm'}
                    w={'100%'}
                    bg={'surface.main'}
                    c={'text.main'}
                    role={'menuitem'}
                    disabled={!clipboard()}
                    onClick={input.handleMenuPaste}
                  />
                </Box>
                <Box as={'li'} role={'none'}>
                  <Item
                    as={'button'}
                    type={'button'}
                    media={<Icon name={Trash2} />}
                    title={'삭제'}
                    action={'⌫'}
                    size={'sm'}
                    w={'100%'}
                    bg={'surface.main'}
                    c={'text.main'}
                    role={'menuitem'}
                    disabled={isDeleteDisabled()}
                    onClick={input.handleMenuDelete}
                  />
                </Box>
              </Box>
            </Box>
            <Box as={'li'} class={styles.contextMenuGroup} role={'none'}>
              <Box as={'ul'} role={'none'} class={styles.contextMenuList}>
                <Box as={'li'} role={'none'}>
                  <Item
                    as={'button'}
                    type={'button'}
                    media={<Icon name={SquareDashedMousePointer} />}
                    title={'선택 해제'}
                    action={'⌘D'}
                    size={'sm'}
                    w={'100%'}
                    bg={'surface.main'}
                    c={'text.main'}
                    role={'menuitem'}
                    disabled={selection().length === 0}
                    onClick={input.handleClearSelection}
                  />
                </Box>
                <Box as={'li'} role={'none'}>
                  <Item
                    as={'button'}
                    type={'button'}
                    media={<Icon name={RefreshCcw} />}
                    title={'뷰 초기화'}
                    action={'⌘R'}
                    size={'sm'}
                    w={'100%'}
                    bg={'surface.main'}
                    c={'text.main'}
                    role={'menuitem'}
                    onClick={input.handleResetView}
                  />
                </Box>
              </Box>
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
