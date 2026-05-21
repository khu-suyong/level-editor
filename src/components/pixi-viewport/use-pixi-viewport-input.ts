import type { Accessor, Setter } from 'solid-js';
import { onCleanup, onMount } from 'solid-js';

import type { Cell, TilePlacement } from '@/models/level';
import { type EditorTool, setSelection } from '@/stores/editor';

import { MAX_ZOOM, MIN_ZOOM, TILE_SIZE } from './constants';
import type {
  ContextMenuState,
  DragState,
  LayerMoveState,
  LayerResizeState,
  PixiScene,
  SelectionRect,
} from './types';
import type { PixiEditorActions } from './use-pixi-editor-actions';
import type { PixiSceneApi } from './use-pixi-scene';
import {
  cellsEqual,
  clamp,
  coordinateKey,
  getCellEdgePoint,
  getLayerResizeHandleAt,
  getResizedLayerBounds,
  getTileBounds,
  isCellInBounds,
  isEditableTarget,
  moveLayerBounds,
  moveLayerTiles,
  normalizeTiles,
  scaleLayerTiles,
  uniqueCells,
} from './util';

type UsePixiViewportInputParams = {
  actions: PixiEditorActions;
  contextMenu: Accessor<ContextMenuState>;
  getHost: () => HTMLDivElement;
  hoverCell: Accessor<Cell | null>;
  scene: Accessor<PixiScene | null>;
  sceneApi: Pick<
    PixiSceneApi,
    | 'getHostPoint'
    | 'redrawScene'
    | 'resetView'
    | 'screenToCell'
    | 'screenToWorld'
  >;
  selectedTool: Accessor<EditorTool>;
  selection: Accessor<TilePlacement[]>;
  setContextMenu: Setter<ContextMenuState>;
  setDragDelta: Setter<Cell | null>;
  setErasePreviewCells: Setter<Cell[]>;
  setHoverCell: Setter<Cell | null>;
  setIsPanning: Setter<boolean>;
  setIsMovingSelection: Setter<boolean>;
  setLayerMovePreview: Setter<LayerMoveState | null>;
  setLayerResizePreview: Setter<LayerResizeState | null>;
  setPaintPreviewCells: Setter<Cell[]>;
  setSelectionRect: Setter<SelectionRect | null>;
  setZoom: (zoom: number) => void;
  zoom: Accessor<number>;
};

type PointerCell = {
  cell: Cell;
  current: PixiScene;
  screenPoint: Cell;
};

type SelectRectDragState = Extract<DragState, { mode: 'select-rect' }>;
type LayerMoveDragState = Extract<DragState, { mode: 'move-layer' }>;
type LayerResizeDragState = Extract<DragState, { mode: 'resize-layer' }>;

const SELECTION_DRAG_THRESHOLD = 4;
const LAYER_RESIZE_HANDLE_HIT_RADIUS = 8;

const cloneTile = (tile: TilePlacement): TilePlacement => ({ ...tile });

export const usePixiViewportInput = ({
  actions,
  contextMenu,
  getHost,
  hoverCell,
  scene,
  sceneApi,
  selectedTool,
  selection,
  setContextMenu,
  setDragDelta,
  setErasePreviewCells,
  setHoverCell,
  setIsPanning,
  setIsMovingSelection,
  setLayerMovePreview,
  setLayerResizePreview,
  setPaintPreviewCells,
  setSelectionRect,
  setZoom,
  zoom,
}: UsePixiViewportInputParams) => {
  let dragState: DragState | null = null;
  let isSpaceDown = false;

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, open: false }));
  };

  const safeReleasePointerCapture = (pointerId: number) => {
    const host = getHost();

    if (!host.hasPointerCapture(pointerId)) {
      return;
    }

    try {
      host.releasePointerCapture(pointerId);
    } catch {
      // Pointer capture can already be gone after browser-level cancellation.
    }
  };

  const resetTransientInputState = () => {
    dragState = null;
    isSpaceDown = false;
    setDragDelta(null);
    setErasePreviewCells([]);
    setIsPanning(false);
    setIsMovingSelection(false);
    setLayerMovePreview(null);
    setLayerResizePreview(null);
    setPaintPreviewCells([]);
    setSelectionRect(null);
  };

  const cancelDrag = () => {
    if (dragState) {
      safeReleasePointerCapture(dragState.pointerId);
    }

    resetTransientInputState();
  };

  const getPointerCell = (
    event: PointerEvent | MouseEvent,
  ): PointerCell | null => {
    const current = scene();

    if (!current) {
      return null;
    }

    const screenPoint = sceneApi.getHostPoint(event.clientX, event.clientY);

    return {
      cell: sceneApi.screenToCell(current, screenPoint),
      current,
      screenPoint,
    };
  };

  const getPasteTarget = () =>
    contextMenu().open ? contextMenu().cell : (hoverCell() ?? { x: 0, y: 0 });

  const beginPan = (pointerId: number, screenPoint: Cell) => {
    dragState = {
      mode: 'pan',
      pointerId,
      lastScreen: screenPoint,
    };
    setIsPanning(true);
  };

  const beginPaint = (pointerId: number, cell: Cell) => {
    dragState = {
      mode: 'paint',
      pointerId,
      lastCell: cell,
      cells: [cell],
    };
    setPaintPreviewCells([cell]);
  };

  const beginErase = (pointerId: number, cell: Cell) => {
    dragState = {
      mode: 'erase',
      pointerId,
      lastCell: cell,
      cells: [cell],
    };
    setErasePreviewCells([cell]);
  };

  const beginMoveSelection = (pointerId: number, cell: Cell) => {
    dragState = {
      mode: 'move-selection',
      pointerId,
      startCell: cell,
    };
    setDragDelta({ x: 0, y: 0 });
    setIsMovingSelection(true);
  };

  const getLayerMoveHit = (cell: Cell) => {
    const sourceTiles = actions.getActiveTiles().map(cloneTile);
    const sourceBounds = getTileBounds(sourceTiles);

    if (!sourceBounds || !isCellInBounds(cell, sourceBounds)) {
      return null;
    }

    return {
      sourceBounds,
      sourceTiles,
    };
  };

  const getLayerResizeHit = (current: PixiScene, screenPoint: Cell) => {
    const sourceTiles = actions.getActiveTiles().map(cloneTile);
    const sourceBounds = getTileBounds(sourceTiles);

    if (!sourceBounds) {
      return null;
    }

    const worldPoint = sceneApi.screenToWorld(current, screenPoint);
    const hitRadius = LAYER_RESIZE_HANDLE_HIT_RADIUS / (zoom() / 100);
    const handle = getLayerResizeHandleAt(sourceBounds, worldPoint, hitRadius);

    if (!handle) {
      return null;
    }

    return {
      handle,
      sourceBounds,
      sourceTiles,
    };
  };

  const createLayerMovePreview = (
    state: LayerMoveDragState,
    targetCell: Cell,
  ): LayerMoveState => {
    const delta = {
      x: targetCell.x - state.startCell.x,
      y: targetCell.y - state.startCell.y,
    };

    return {
      sourceBounds: state.sourceBounds,
      targetBounds: moveLayerBounds(state.sourceBounds, delta),
      previewTiles: moveLayerTiles(state.sourceTiles, delta),
    };
  };

  const createLayerResizePreview = (
    state: LayerResizeDragState,
    current: PixiScene,
    screenPoint: Cell,
  ): LayerResizeState => {
    const edgePoint = getCellEdgePoint(
      sceneApi.screenToWorld(current, screenPoint),
    );
    const targetBounds = getResizedLayerBounds(
      state.sourceBounds,
      state.handle,
      edgePoint,
    );

    return {
      handle: state.handle,
      sourceBounds: state.sourceBounds,
      targetBounds,
      previewTiles: scaleLayerTiles(
        state.sourceTiles,
        state.sourceBounds,
        targetBounds,
      ),
    };
  };

  const beginLayerResize = (
    pointerId: number,
    resizeHit: NonNullable<ReturnType<typeof getLayerResizeHit>>,
  ) => {
    dragState = {
      mode: 'resize-layer',
      pointerId,
      handle: resizeHit.handle,
      sourceBounds: resizeHit.sourceBounds,
      sourceTiles: resizeHit.sourceTiles,
    };
    setLayerResizePreview({
      handle: resizeHit.handle,
      sourceBounds: resizeHit.sourceBounds,
      targetBounds: resizeHit.sourceBounds,
      previewTiles: resizeHit.sourceTiles.map(cloneTile),
    });
  };

  const beginLayerMove = (
    pointerId: number,
    cell: Cell,
    screenPoint: Cell,
    moveHit: NonNullable<ReturnType<typeof getLayerMoveHit>>,
  ) => {
    dragState = {
      mode: 'move-layer',
      pointerId,
      startCell: cell,
      startScreen: screenPoint,
      lastCell: cell,
      sourceBounds: moveHit.sourceBounds,
      sourceTiles: moveHit.sourceTiles,
      moved: false,
    };
  };

  const beginSelectionRect = (
    pointerId: number,
    cell: Cell,
    screenPoint: Cell,
    additive: boolean,
  ) => {
    dragState = {
      mode: 'select-rect',
      pointerId,
      startCell: cell,
      startScreen: screenPoint,
      baseSelection: selection().map((tile) => ({ ...tile })),
      additive,
      moved: false,
    };
  };

  const updateDrag = (event: PointerEvent, cell: Cell, screenPoint: Cell) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    if (dragState.mode === 'pan') {
      const current = scene();

      if (!current) {
        return;
      }

      current.pan.x += screenPoint.x - dragState.lastScreen.x;
      current.pan.y += screenPoint.y - dragState.lastScreen.y;
      dragState.lastScreen = screenPoint;
      sceneApi.redrawScene(current);
      return;
    }

    if (
      (dragState.mode === 'paint' || dragState.mode === 'erase') &&
      !cellsEqual(dragState.lastCell, cell)
    ) {
      dragState.lastCell = cell;
      dragState.cells = [...dragState.cells, cell];

      if (dragState.mode === 'paint') {
        setPaintPreviewCells(uniqueCells(dragState.cells));
      } else {
        setErasePreviewCells(uniqueCells(dragState.cells));
      }
      return;
    }

    if (dragState.mode === 'move-selection') {
      setDragDelta({
        x: cell.x - dragState.startCell.x,
        y: cell.y - dragState.startCell.y,
      });
      return;
    }

    if (dragState.mode === 'move-layer') {
      dragState.lastCell = cell;

      const hasCellDelta = !cellsEqual(dragState.startCell, cell);
      const movedFarEnough =
        Math.abs(screenPoint.x - dragState.startScreen.x) >=
          SELECTION_DRAG_THRESHOLD ||
        Math.abs(screenPoint.y - dragState.startScreen.y) >=
          SELECTION_DRAG_THRESHOLD;

      if (!hasCellDelta || (!dragState.moved && !movedFarEnough)) {
        return;
      }

      dragState.moved = true;
      setLayerMovePreview(createLayerMovePreview(dragState, cell));
      return;
    }

    if (dragState.mode === 'resize-layer') {
      const current = scene();

      if (!current) {
        return;
      }

      setLayerResizePreview(
        createLayerResizePreview(dragState, current, screenPoint),
      );
      return;
    }

    if (dragState.mode === 'select-rect') {
      const movedFarEnough =
        Math.abs(screenPoint.x - dragState.startScreen.x) >=
          SELECTION_DRAG_THRESHOLD ||
        Math.abs(screenPoint.y - dragState.startScreen.y) >=
          SELECTION_DRAG_THRESHOLD;

      if (!movedFarEnough || cellsEqual(dragState.startCell, cell)) {
        return;
      }

      dragState.moved = true;
      setSelectionRect({ start: dragState.startCell, end: cell });
    }
  };

  const commitClickSelection = (cell: Cell, state: SelectRectDragState) => {
    const clickedTile = actions.findTileAt(cell);

    if (!clickedTile) {
      setSelection(state.additive ? state.baseSelection : []);
      return;
    }

    if (!state.additive) {
      setSelection([clickedTile]);
      return;
    }

    const selectedKeys = new Set(state.baseSelection.map(coordinateKey));
    setSelection(
      selectedKeys.has(coordinateKey(clickedTile))
        ? state.baseSelection.filter((tile) => !cellsEqual(tile, clickedTile))
        : normalizeTiles([...state.baseSelection, clickedTile]),
    );
  };

  const commitLayerClickSelection = (cell: Cell) => {
    const clickedTile = actions.findTileAt(cell);

    setSelection(clickedTile ? [clickedTile] : []);
  };

  const commitDrag = (pointerCell: PointerCell | null) => {
    if (!dragState) {
      return;
    }

    const cell = pointerCell?.cell ?? null;

    if (dragState.mode === 'paint') {
      actions.paintCells(dragState.cells);
      return;
    }

    if (dragState.mode === 'erase') {
      actions.eraseCells(dragState.cells);
      return;
    }

    if (dragState.mode === 'move-selection') {
      if (!cell) {
        return;
      }

      actions.moveSelection({
        x: cell.x - dragState.startCell.x,
        y: cell.y - dragState.startCell.y,
      });
      return;
    }

    if (dragState.mode === 'move-layer') {
      const targetCell = pointerCell?.cell ?? dragState.lastCell;

      if (!dragState.moved) {
        commitLayerClickSelection(targetCell);
        return;
      }

      actions.moveActiveLayer(dragState.sourceTiles, {
        x: targetCell.x - dragState.startCell.x,
        y: targetCell.y - dragState.startCell.y,
      });
      return;
    }

    if (dragState.mode === 'resize-layer') {
      const resizePreview = pointerCell
        ? createLayerResizePreview(
            dragState,
            pointerCell.current,
            pointerCell.screenPoint,
          )
        : {
            handle: dragState.handle,
            sourceBounds: dragState.sourceBounds,
            targetBounds: dragState.sourceBounds,
            previewTiles: dragState.sourceTiles.map(cloneTile),
          };

      actions.resizeActiveLayer(
        dragState.sourceTiles,
        resizePreview.previewTiles,
      );
      return;
    }

    if (dragState.mode === 'select-rect') {
      if (cell) {
        if (dragState.moved) {
          actions.selectTilesInRect(
            dragState.startCell,
            cell,
            dragState.baseSelection,
            dragState.additive,
          );
        } else {
          commitClickSelection(cell, dragState);
        }
      }
      return;
    }
  };

  const finishDrag = (event: PointerEvent) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const pointerCell = getPointerCell(event);

    safeReleasePointerCapture(event.pointerId);
    commitDrag(pointerCell);
    resetTransientInputState();
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button === 2) {
      return;
    }

    const pointerCell = getPointerCell(event);

    if (!pointerCell) {
      return;
    }

    event.preventDefault();
    closeContextMenu();
    getHost().setPointerCapture(event.pointerId);

    if (event.button === 1 || isSpaceDown || selectedTool() === 'pan') {
      beginPan(event.pointerId, pointerCell.screenPoint);
      return;
    }

    if (selectedTool() === 'brush') {
      beginPaint(event.pointerId, pointerCell.cell);
      return;
    }

    if (selectedTool() === 'erase') {
      beginErase(event.pointerId, pointerCell.cell);
      return;
    }

    if (selectedTool() === 'select') {
      const resizeHit = getLayerResizeHit(
        pointerCell.current,
        pointerCell.screenPoint,
      );

      if (resizeHit) {
        beginLayerResize(event.pointerId, resizeHit);
        return;
      }
    }

    if (
      selectedTool() === 'select' &&
      !event.shiftKey &&
      selection().some((tile) => cellsEqual(tile, pointerCell.cell))
    ) {
      beginMoveSelection(event.pointerId, pointerCell.cell);
      return;
    }

    if (selectedTool() === 'select' && !event.shiftKey) {
      const moveHit = getLayerMoveHit(pointerCell.cell);

      if (moveHit) {
        beginLayerMove(
          event.pointerId,
          pointerCell.cell,
          pointerCell.screenPoint,
          moveHit,
        );
        return;
      }
    }

    beginSelectionRect(
      event.pointerId,
      pointerCell.cell,
      pointerCell.screenPoint,
      event.shiftKey,
    );
  };

  const handlePointerMove = (event: PointerEvent) => {
    const pointerCell = getPointerCell(event);

    if (!pointerCell) {
      return;
    }

    setHoverCell(pointerCell.cell);
    updateDrag(event, pointerCell.cell, pointerCell.screenPoint);
  };

  const handlePointerUp = (event: PointerEvent) => {
    finishDrag(event);
  };

  const handlePointerCancel = (event: PointerEvent) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    cancelDrag();
  };

  const handlePointerLeave = () => {
    if (!dragState) {
      setHoverCell(null);
    }
  };

  const handleWheel = (event: WheelEvent) => {
    const current = scene();

    if (!current) {
      return;
    }

    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      const oldScale = zoom() / 100;
      const screenPoint = sceneApi.getHostPoint(event.clientX, event.clientY);
      const worldPoint = {
        x: (screenPoint.x - current.pan.x) / oldScale,
        y: (current.pan.y - screenPoint.y) / oldScale,
      };
      const zoomStep = event.deltaY > 0 ? -5 : 5;
      const nextZoom = clamp(zoom() + zoomStep, MIN_ZOOM, MAX_ZOOM);
      const nextScale = nextZoom / 100;

      current.pan.x = screenPoint.x - worldPoint.x * nextScale;
      current.pan.y = screenPoint.y + worldPoint.y * nextScale;
      setZoom(nextZoom);
      sceneApi.redrawScene(current);
      return;
    }

    current.pan.x -= event.shiftKey ? event.deltaY : event.deltaX;
    current.pan.y -= event.shiftKey ? 0 : event.deltaY;
    sceneApi.redrawScene(current);
  };

  const handleContextMenu = (event: MouseEvent) => {
    const pointerCell = getPointerCell(event);

    if (!pointerCell) {
      return;
    }

    event.preventDefault();

    const host = getHost();

    setContextMenu({
      open: true,
      pointerX: clamp(
        pointerCell.screenPoint.x,
        8,
        Math.max(8, host.clientWidth - 168),
      ),
      pointerY: clamp(
        pointerCell.screenPoint.y,
        8,
        Math.max(8, host.clientHeight - 188),
      ),
      cell: pointerCell.cell,
    });
  };

  const handleCommandShortcut = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      actions.copySelection();
      return true;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
      event.preventDefault();
      actions.pasteClipboard(getPasteTarget());
      closeContextMenu();
      return true;
    }

    return false;
  };

  const handleCanvasCommand = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelDrag();
      closeContextMenu();
      setSelection([]);
      return true;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      actions.deleteSelection();
      return true;
    }

    if (event.key === '0') {
      event.preventDefault();
      sceneApi.resetView();
      return true;
    }

    return false;
  };

  const handleKeyboardPan = (event: KeyboardEvent, current: PixiScene) => {
    const panStep = event.shiftKey ? TILE_SIZE * 4 : TILE_SIZE;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      current.pan.x += panStep;
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      current.pan.x -= panStep;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      current.pan.y += panStep;
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      current.pan.y -= panStep;
    } else {
      return false;
    }

    sceneApi.redrawScene(current);
    return true;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const current = scene();

    if (isEditableTarget(event.target) || !current) {
      return;
    }

    if (event.code === 'Space') {
      isSpaceDown = true;
      event.preventDefault();
      return;
    }

    if (handleCommandShortcut(event)) {
      return;
    }

    if (handleCanvasCommand(event)) {
      return;
    }

    handleKeyboardPan(event, current);
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      isSpaceDown = false;
    }
  };

  const handleMenuCopy = () => {
    actions.copySelection();
    closeContextMenu();
  };

  const handleMenuPaste = () => {
    actions.pasteClipboard(contextMenu().cell);
    closeContextMenu();
  };

  const handleMenuDelete = () => {
    const menuState = contextMenu();

    if (selection().length > 0) {
      actions.deleteSelection();
    } else {
      actions.eraseCells([menuState.cell]);
    }

    closeContextMenu();
  };

  const handleClearSelection = () => {
    setSelection([]);
    closeContextMenu();
  };

  const handleResetView = () => {
    sceneApi.resetView();
    closeContextMenu();
  };

  const handleWindowBlur = () => {
    cancelDrag();
  };

  onMount(() => {
    const host = getHost();

    host.addEventListener('pointerdown', handlePointerDown);
    host.addEventListener('pointermove', handlePointerMove);
    host.addEventListener('pointerup', handlePointerUp);
    host.addEventListener('pointercancel', handlePointerCancel);
    host.addEventListener('pointerleave', handlePointerLeave);
    host.addEventListener('wheel', handleWheel, { passive: false });
    host.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    onCleanup(() => {
      cancelDrag();
      host.removeEventListener('pointerdown', handlePointerDown);
      host.removeEventListener('pointermove', handlePointerMove);
      host.removeEventListener('pointerup', handlePointerUp);
      host.removeEventListener('pointercancel', handlePointerCancel);
      host.removeEventListener('pointerleave', handlePointerLeave);
      host.removeEventListener('wheel', handleWheel);
      host.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    });
  });

  return {
    handleClearSelection,
    handleMenuCopy,
    handleMenuDelete,
    handleMenuPaste,
    handleResetView,
  };
};
