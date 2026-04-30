import type { Accessor, Setter } from 'solid-js';
import { onCleanup, onMount } from 'solid-js';

import type { Cell, TilePlacement } from '@/models/level';
import { type EditorTool, setSelection } from '@/stores/editor';

import { MAX_ZOOM, MIN_ZOOM, TILE_SIZE } from './constants';
import type {
  ContextMenuState,
  DragState,
  PixiScene,
  SelectionRect,
} from './types';
import type { PixiEditorActions } from './use-pixi-editor-actions';
import type { PixiSceneApi } from './use-pixi-scene';
import {
  cellsEqual,
  clamp,
  coordinateKey,
  isEditableTarget,
  normalizeTiles,
} from './util';

type UsePixiViewportInputParams = {
  actions: PixiEditorActions;
  contextMenu: Accessor<ContextMenuState>;
  dragDelta: Accessor<Cell | null>;
  getHost: () => HTMLDivElement;
  hoverCell: Accessor<Cell | null>;
  scene: Accessor<PixiScene | null>;
  sceneApi: Pick<
    PixiSceneApi,
    'getHostPoint' | 'redrawScene' | 'resetView' | 'screenToCell'
  >;
  selectedTool: Accessor<EditorTool>;
  selection: Accessor<TilePlacement[]>;
  setContextMenu: Setter<ContextMenuState>;
  setDragDelta: Setter<Cell | null>;
  setHoverCell: Setter<Cell | null>;
  setIsPanning: Setter<boolean>;
  setSelectionRect: Setter<SelectionRect | null>;
  setZoom: (zoom: number) => void;
  zoom: Accessor<number>;
};

export const usePixiViewportInput = ({
  actions,
  contextMenu,
  dragDelta,
  getHost,
  hoverCell,
  scene,
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
}: UsePixiViewportInputParams) => {
  let dragState: DragState | null = null;
  let isSpaceDown = false;

  const startPan = (pointerId: number, screenPoint: Cell) => {
    dragState = {
      mode: 'pan',
      pointerId,
      lastScreen: screenPoint,
    };
    setIsPanning(true);
  };

  const handlePointerDown = (event: PointerEvent) => {
    const current = scene();

    if (!current || event.button === 2) {
      return;
    }

    const host = getHost();

    setContextMenu((prev) => ({ ...prev, open: false }));
    host.setPointerCapture(event.pointerId);

    const screenPoint = sceneApi.getHostPoint(event.clientX, event.clientY);
    const cell = sceneApi.screenToCell(current, screenPoint);

    if (event.button === 1 || isSpaceDown || selectedTool() === 'pan') {
      event.preventDefault();
      startPan(event.pointerId, screenPoint);
      return;
    }

    if (selectedTool() === 'brush') {
      event.preventDefault();
      dragState = {
        mode: 'paint',
        pointerId: event.pointerId,
        lastCell: cell,
        cells: [cell],
      };
      return;
    }

    if (selectedTool() === 'erase') {
      event.preventDefault();
      dragState = {
        mode: 'erase',
        pointerId: event.pointerId,
        lastCell: cell,
        cells: [cell],
      };
      return;
    }

    const selectedKeys = new Set(selection().map(coordinateKey));

    if (selectedKeys.has(coordinateKey(cell)) && !event.shiftKey) {
      event.preventDefault();
      dragState = {
        mode: 'move-selection',
        pointerId: event.pointerId,
        startCell: cell,
        baseSelection: selection(),
        moved: false,
      };
      return;
    }

    event.preventDefault();
    dragState = {
      mode: 'select-rect',
      pointerId: event.pointerId,
      startCell: cell,
      baseSelection: selection(),
      additive: event.shiftKey,
      moved: false,
    };
    setSelectionRect({ start: cell, end: cell });
  };

  const handlePointerMove = (event: PointerEvent) => {
    const current = scene();

    if (!current) {
      return;
    }

    const screenPoint = sceneApi.getHostPoint(event.clientX, event.clientY);
    const cell = sceneApi.screenToCell(current, screenPoint);

    setHoverCell(cell);

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    if (dragState.mode === 'pan') {
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
      return;
    }

    if (dragState.mode === 'select-rect') {
      if (!cellsEqual(dragState.startCell, cell)) {
        dragState.moved = true;
        setSelectionRect({ start: dragState.startCell, end: cell });
        actions.selectTilesInRect(
          dragState.startCell,
          cell,
          dragState.baseSelection,
          dragState.additive,
        );
      }
      return;
    }

    if (dragState.mode === 'move-selection') {
      const delta = {
        x: cell.x - dragState.startCell.x,
        y: cell.y - dragState.startCell.y,
      };

      dragState.moved = delta.x !== 0 || delta.y !== 0;
      setDragDelta(delta);
    }
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const host = getHost();
    const current = scene();
    const screenPoint = current
      ? sceneApi.getHostPoint(event.clientX, event.clientY)
      : { x: 0, y: 0 };
    const cell = current ? sceneApi.screenToCell(current, screenPoint) : null;

    host.releasePointerCapture(event.pointerId);

    if (dragState.mode === 'paint') {
      actions.paintCells(dragState.cells);
    }

    if (dragState.mode === 'erase') {
      actions.eraseCells(dragState.cells);
    }

    if (dragState.mode === 'select-rect' && cell) {
      if (!dragState.moved) {
        const clickedTile = actions.findTileAt(cell);

        if (!clickedTile) {
          setSelection(dragState.additive ? dragState.baseSelection : []);
        } else if (dragState.additive) {
          const selectedKeys = new Set(
            dragState.baseSelection.map(coordinateKey),
          );

          setSelection(
            selectedKeys.has(coordinateKey(clickedTile))
              ? dragState.baseSelection.filter(
                  (tile) => !cellsEqual(tile, clickedTile),
                )
              : normalizeTiles([...dragState.baseSelection, clickedTile]),
          );
        } else {
          setSelection([clickedTile]);
        }
      }

      setSelectionRect(null);
    }

    if (dragState.mode === 'move-selection') {
      const delta = dragDelta();

      if (delta && dragState.moved) {
        actions.moveSelection(delta);
      }
      setDragDelta(null);
    }

    if (dragState.mode === 'pan') {
      setIsPanning(false);
    }

    dragState = null;
  };

  const handlePointerLeave = () => {
    setHoverCell(null);
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
    const current = scene();

    if (!current) {
      return;
    }

    event.preventDefault();

    const host = getHost();
    const screenPoint = sceneApi.getHostPoint(event.clientX, event.clientY);
    const cell = sceneApi.screenToCell(current, screenPoint);

    setContextMenu({
      open: true,
      pointerX: clamp(screenPoint.x, 8, Math.max(8, host.clientWidth - 168)),
      pointerY: clamp(screenPoint.y, 8, Math.max(8, host.clientHeight - 188)),
      cell,
    });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const current = scene();

    if (isEditableTarget(event.target)) {
      return;
    }

    if (!current) {
      return;
    }

    if (event.code === 'Space') {
      isSpaceDown = true;
      event.preventDefault();
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      actions.copySelection();
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
      event.preventDefault();
      actions.pasteClipboard(
        contextMenu()?.cell ?? hoverCell() ?? { x: 0, y: 0 },
      );
      setContextMenu((prev) => ({ ...prev, open: false }));
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setContextMenu((prev) => ({ ...prev, open: false }));
      setSelectionRect(null);
      setDragDelta(null);
      setSelection([]);
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      actions.deleteSelection();
      return;
    }

    if (event.key === '0') {
      event.preventDefault();
      sceneApi.resetView();
      return;
    }

    const panStep = event.shiftKey ? TILE_SIZE * 4 : TILE_SIZE;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      current.pan.x += panStep;
      sceneApi.redrawScene(current);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      current.pan.x -= panStep;
      sceneApi.redrawScene(current);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      current.pan.y += panStep;
      sceneApi.redrawScene(current);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      current.pan.y -= panStep;
      sceneApi.redrawScene(current);
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      isSpaceDown = false;
    }
  };

  const handleMenuCopy = () => {
    actions.copySelection();
    setContextMenu((prev) => ({ ...prev, open: false }));
  };

  const handleMenuPaste = () => {
    const menuState = contextMenu();

    if (menuState) {
      actions.pasteClipboard(menuState.cell);
    }

    setContextMenu((prev) => ({ ...prev, open: false }));
  };

  const handleMenuDelete = () => {
    const menuState = contextMenu();

    if (selection().length > 0) {
      actions.deleteSelection();
    } else if (menuState) {
      actions.eraseCells([menuState.cell]);
    }

    setContextMenu((prev) => ({ ...prev, open: false }));
  };

  const handleClearSelection = () => {
    setSelection([]);
    setContextMenu((prev) => ({ ...prev, open: false }));
  };

  const handleResetView = () => {
    sceneApi.resetView();
    setContextMenu((prev) => ({ ...prev, open: false }));
  };

  onMount(() => {
    const host = getHost();

    host.addEventListener('pointerdown', handlePointerDown);
    host.addEventListener('pointermove', handlePointerMove);
    host.addEventListener('pointerup', handlePointerUp);
    host.addEventListener('pointercancel', handlePointerUp);
    host.addEventListener('pointerleave', handlePointerLeave);
    host.addEventListener('wheel', handleWheel, { passive: false });
    host.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    onCleanup(() => {
      host.removeEventListener('pointerdown', handlePointerDown);
      host.removeEventListener('pointermove', handlePointerMove);
      host.removeEventListener('pointerup', handlePointerUp);
      host.removeEventListener('pointercancel', handlePointerUp);
      host.removeEventListener('pointerleave', handlePointerLeave);
      host.removeEventListener('wheel', handleWheel);
      host.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
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
