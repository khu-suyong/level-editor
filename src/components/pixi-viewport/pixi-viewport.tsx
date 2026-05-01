import { useStore } from '@nanostores/solid';
import { Box, Popup, vars } from '@suis-ui/kit';
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
import { Item } from '../ui/item';
import { ItemGroup } from '../ui/item/item-group';
import * as styles from './pixi-viewport.css';
import type { ContextMenuState, SelectionRect } from './types';
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
  const [isPanning, setIsPanning] = createSignal(false);
  const [isMovingSelection, setIsMovingSelection] = createSignal(false);

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
    snapshot,
  });
  const sceneApi = usePixiScene({
    activeLayerId,
    brushTileId: actions.getDefaultTileId,
    clipboard,
    contextMenu,
    dragDelta,
    erasePreviewCells,
    getHost,
    hoverCell,
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
            style={{ 'box-shadow': vars.shadow.lg }}
          >
            <ItemGroup>
              <Item
                disabled
                as={'li'}
                role={'presentation'}
                title={'선택된 셀'}
              >
                {`${contextMenu().cell.x}, ${contextMenu().cell.y}`}
              </Item>
            </ItemGroup>
            <ItemGroup>
              <Box as={'li'} role={'none'}>
                <Item
                  icon={Copy}
                  title={'복사'}
                  role={'menuitem'}
                  disabled={selection().length === 0}
                  onClick={input.handleMenuCopy}
                >
                  {'⌘C'}
                </Item>
              </Box>
              <Box as={'li'} role={'none'}>
                <Item
                  icon={ClipboardPaste}
                  title={'붙여넣기'}
                  role={'menuitem'}
                  disabled={!clipboard()}
                  onClick={input.handleMenuPaste}
                >
                  {'⌘V'}
                </Item>
              </Box>
              <Box as={'li'} role={'none'}>
                <Item
                  icon={Trash2}
                  title={'삭제'}
                  role={'menuitem'}
                  disabled={isDeleteDisabled()}
                  onClick={input.handleMenuDelete}
                >
                  {'⌫'}
                </Item>
              </Box>
            </ItemGroup>
            <ItemGroup>
              <Box as={'li'} role={'none'}>
                <Item
                  icon={SquareDashedMousePointer}
                  title={'선택 해제'}
                  role={'menuitem'}
                  disabled={selection().length === 0}
                  onClick={input.handleClearSelection}
                >
                  {'⌘D'}
                </Item>
              </Box>
              <Box as={'li'} role={'none'}>
                <Item
                  icon={RefreshCcw}
                  title={'뷰 초기화'}
                  role={'menuitem'}
                  onClick={input.handleResetView}
                >
                  {'⌘R'}
                </Item>
              </Box>
            </ItemGroup>
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
