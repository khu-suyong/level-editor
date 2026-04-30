import { Application, Container, Graphics } from 'pixi.js';
import type { Accessor } from 'solid-js';
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';

import type { Cell, LevelData, TilePlacement } from '@/models/level';
import { setCanvasReady } from '@/stores/editor';

import { TILE_SIZE } from './constants';
import * as styles from './pixi-viewport.css';
import type { ContextMenuState, PixiScene, SelectionRect } from './types';
import { coordinateKey, getCellRect, tileColor } from './util';

type UsePixiSceneParams = {
  activeLayerId: Accessor<string>;
  clipboard: Accessor<{
    tiles: TilePlacement[];
  } | null>;
  contextMenu: Accessor<ContextMenuState | null>;
  dragDelta: Accessor<Cell | null>;
  getActiveTiles: Accessor<TilePlacement[]>;
  getHost: () => HTMLDivElement;
  hoverCell: Accessor<Cell | null>;
  selection: Accessor<TilePlacement[]>;
  selectionRect: Accessor<SelectionRect | null>;
  setZoom: (zoom: number) => void;
  snapshot: Accessor<LevelData>;
  zoom: Accessor<number>;
};

export const usePixiScene = ({
  activeLayerId,
  clipboard,
  contextMenu,
  dragDelta,
  getActiveTiles,
  getHost,
  hoverCell,
  selection,
  selectionRect,
  setZoom,
  snapshot,
  zoom,
}: UsePixiSceneParams) => {
  const [scene, setScene] = createSignal<PixiScene | null>(null);

  const getHostPoint = (clientX: number, clientY: number) => {
    const bounds = getHost().getBoundingClientRect();

    return {
      x: clientX - bounds.left,
      y: clientY - bounds.top,
    };
  };

  const screenToWorld = (current: PixiScene, screenPoint: Cell) => {
    const scale = zoom() / 100;

    return {
      x: (screenPoint.x - current.pan.x) / scale,
      y: (screenPoint.y - current.pan.y) / scale,
    };
  };

  const screenToCell = (current: PixiScene, screenPoint: Cell) => {
    const worldPoint = screenToWorld(current, screenPoint);

    return {
      x: Math.floor(worldPoint.x / TILE_SIZE),
      y: Math.floor(worldPoint.y / TILE_SIZE),
    };
  };

  const drawBackground = (current: PixiScene) => {
    const host = getHost();

    current.background.clear();
    current.background
      .rect(0, 0, host.clientWidth, host.clientHeight)
      .fill({ color: 0x101827 });
  };

  const drawGrid = (current: PixiScene) => {
    const host = getHost();
    const scale = zoom() / 100;
    const lineWidth = 1 / scale;
    const topLeft = screenToWorld(current, { x: 0, y: 0 });
    const bottomRight = screenToWorld(current, {
      x: host.clientWidth,
      y: host.clientHeight,
    });
    const minX = Math.floor(topLeft.x / TILE_SIZE) * TILE_SIZE;
    const maxX = Math.ceil(bottomRight.x / TILE_SIZE) * TILE_SIZE;
    const minY = Math.floor(topLeft.y / TILE_SIZE) * TILE_SIZE;
    const maxY = Math.ceil(bottomRight.y / TILE_SIZE) * TILE_SIZE;

    current.grid.clear();

    for (let x = minX; x <= maxX; x += TILE_SIZE) {
      current.grid
        .moveTo(x, minY)
        .lineTo(x, maxY)
        .stroke({
          color: x === 0 ? 0x64748b : 0x263244,
          width: x === 0 ? lineWidth * 2 : lineWidth,
        });
    }

    for (let y = minY; y <= maxY; y += TILE_SIZE) {
      current.grid
        .moveTo(minX, y)
        .lineTo(maxX, y)
        .stroke({
          color: y === 0 ? 0x64748b : 0x263244,
          width: y === 0 ? lineWidth * 2 : lineWidth,
        });
    }
  };

  const drawTiles = (current: PixiScene) => {
    const scale = zoom() / 100;
    const lineWidth = 1 / scale;

    current.tileLayer.clear();

    for (const layer of [...snapshot().layers].sort(
      (first, second) => first.order - second.order,
    )) {
      const isActiveLayer = layer.id === activeLayerId();

      for (const tile of layer.tiles) {
        const rect = getCellRect(tile);

        current.tileLayer
          .rect(rect.x + 1, rect.y + 1, TILE_SIZE - 2, TILE_SIZE - 2)
          .fill({
            color: tileColor(tile.tileId),
            alpha: isActiveLayer ? 0.82 : 0.36,
          })
          .stroke({
            color: isActiveLayer ? 0x93c5fd : 0x475569,
            alpha: isActiveLayer ? 0.55 : 0.32,
            width: lineWidth,
          });
      }
    }
  };

  const drawPreview = (current: PixiScene) => {
    current.preview.clear();

    const currentClipboard = clipboard();
    const menuState = contextMenu();
    const targetCell = menuState?.cell ?? hoverCell();

    if (!currentClipboard || !targetCell || menuState) {
      return;
    }

    for (const tile of currentClipboard.tiles) {
      const rect = getCellRect({
        x: targetCell.x + tile.x,
        y: targetCell.y + tile.y,
      });

      current.preview
        .rect(rect.x + 1, rect.y + 1, TILE_SIZE - 2, TILE_SIZE - 2)
        .fill({ color: tileColor(tile.tileId), alpha: 0.24 })
        .stroke({
          color: 0x38bdf8,
          alpha: 0.56,
          width: 1 / (zoom() / 100),
        });
    }
  };

  const drawOverlay = (current: PixiScene) => {
    const scale = zoom() / 100;
    const lineWidth = 2 / scale;
    const selectedKeys = new Set(selection().map(coordinateKey));
    const delta = dragDelta();
    const hover = hoverCell();
    const rectSelection = selectionRect();

    current.overlay.clear();

    if (hover) {
      const rect = getCellRect(hover);

      current.overlay
        .rect(rect.x, rect.y, TILE_SIZE, TILE_SIZE)
        .stroke({ color: 0xf8fafc, alpha: 0.42, width: lineWidth });
    }

    for (const tile of selection()) {
      const rect = getCellRect({
        x: tile.x + (delta?.x ?? 0),
        y: tile.y + (delta?.y ?? 0),
      });

      current.overlay
        .rect(rect.x + 1, rect.y + 1, TILE_SIZE - 2, TILE_SIZE - 2)
        .fill({ color: 0xfacc15, alpha: delta ? 0.18 : 0.08 })
        .stroke({ color: 0xfacc15, alpha: 0.9, width: lineWidth });
    }

    if (rectSelection) {
      const minX = Math.min(rectSelection.start.x, rectSelection.end.x);
      const maxX = Math.max(rectSelection.start.x, rectSelection.end.x);
      const minY = Math.min(rectSelection.start.y, rectSelection.end.y);
      const maxY = Math.max(rectSelection.start.y, rectSelection.end.y);

      current.overlay
        .rect(
          minX * TILE_SIZE,
          minY * TILE_SIZE,
          (maxX - minX + 1) * TILE_SIZE,
          (maxY - minY + 1) * TILE_SIZE,
        )
        .fill({ color: 0x38bdf8, alpha: 0.08 })
        .stroke({ color: 0x38bdf8, alpha: 0.78, width: lineWidth });
    }

    for (const tile of getActiveTiles()) {
      if (!selectedKeys.has(coordinateKey(tile))) {
        continue;
      }

      const rect = getCellRect(tile);
      current.overlay
        .rect(rect.x + 5, rect.y + 5, TILE_SIZE - 10, TILE_SIZE - 10)
        .stroke({ color: 0xfef08a, alpha: 0.72, width: 1 / scale });
    }
  };

  const redrawScene = (current: PixiScene) => {
    const scale = zoom() / 100;

    current.world.position.set(current.pan.x, current.pan.y);
    current.world.scale.set(scale);

    drawBackground(current);
    drawGrid(current);
    drawTiles(current);
    drawPreview(current);
    drawOverlay(current);
  };

  const resetView = () => {
    const current = scene();

    if (!current) {
      return;
    }

    current.pan.x = 0;
    current.pan.y = 0;
    setZoom(100);
    redrawScene(current);
  };

  onMount(() => {
    let disposed = false;
    const host = getHost();
    const app = new Application();
    const background = new Graphics();
    const grid = new Graphics();
    const tileLayer = new Graphics();
    const preview = new Graphics();
    const overlay = new Graphics();
    const world = new Container();
    const resizeObserver = new ResizeObserver(() => {
      const current = scene();

      if (!app.renderer || !current) {
        return;
      }

      app.renderer.resize(host.clientWidth, host.clientHeight);
      redrawScene(current);
    });

    void app
      .init({
        antialias: true,
        autoDensity: true,
        background: '#101827',
        height: host.clientHeight,
        resolution: window.devicePixelRatio || 1,
        width: host.clientWidth,
      })
      .then(() => {
        if (disposed) {
          app.destroy();
          return;
        }

        const current: PixiScene = {
          app,
          background,
          grid,
          overlay,
          preview,
          tileLayer,
          world,
          pan: { x: 0, y: 0 },
        };

        app.canvas.className = styles.pixiCanvas;
        host.appendChild(app.canvas);
        world.addChild(grid, tileLayer, preview, overlay);
        app.stage.addChild(background, world);
        redrawScene(current);
        resizeObserver.observe(host);
        setScene(current);
        setCanvasReady(true);
      });

    onCleanup(() => {
      disposed = true;
      resizeObserver.disconnect();
      setCanvasReady(false);
      app.destroy(true);
    });
  });

  createEffect(() => {
    const current = scene();

    if (!current) {
      return;
    }

    redrawScene(current);
  });

  return {
    getHostPoint,
    redrawScene,
    resetView,
    scene,
    screenToCell,
    screenToWorld,
  };
};

export type PixiSceneApi = ReturnType<typeof usePixiScene>;
