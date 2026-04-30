import Color from 'color';
import { Application, Container, Graphics } from 'pixi.js';
import type { Accessor } from 'solid-js';
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';

import type { Cell, LevelData, TilePlacement } from '@/models/level';
import { type EditorTool, setCanvasReady } from '@/stores/editor';

import { TILE_SIZE } from './constants';
import * as styles from './pixi-viewport.css';
import type { ContextMenuState, PixiScene, SelectionRect } from './types';
import { coordinateKey, getCellRect, tileColor } from './util';

type UsePixiSceneParams = {
  activeLayerId: Accessor<string>;
  brushTileId: Accessor<number>;
  clipboard: Accessor<{
    tiles: TilePlacement[];
  } | null>;
  contextMenu: Accessor<ContextMenuState>;
  dragDelta: Accessor<Cell | null>;
  getHost: () => HTMLDivElement;
  hoverCell: Accessor<Cell | null>;
  paintPreviewCells: Accessor<Cell[]>;
  selectedTool: Accessor<EditorTool>;
  selection: Accessor<TilePlacement[]>;
  selectionRect: Accessor<SelectionRect | null>;
  setZoom: (zoom: number) => void;
  snapshot: Accessor<LevelData>;
  zoom: Accessor<number>;
};

const DEFAULT_VIEWPORT_BACKGROUND_COLOR = 0x101827;

const clampColorChannel = (value: number) =>
  Math.min(255, Math.max(0, Math.round(value)));

const parseOklchNumber = (value: string) => {
  if (value === 'none') {
    return 0;
  }

  const unitlessValue = value.endsWith('%') ? value.slice(0, -1) : value;
  const parsedValue = Number(unitlessValue);

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return value.endsWith('%') ? parsedValue / 100 : parsedValue;
};

const parseOklchHue = (value: string) => {
  if (value === 'none') {
    return 0;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.endsWith('turn')) {
    return Number(trimmedValue.slice(0, -4)) * 360;
  }

  if (trimmedValue.endsWith('rad')) {
    return (Number(trimmedValue.slice(0, -3)) * 180) / Math.PI;
  }

  if (trimmedValue.endsWith('grad')) {
    return Number(trimmedValue.slice(0, -4)) * 0.9;
  }

  return Number(trimmedValue.replace(/deg$/iu, ''));
};

const oklchToRgb = (lightness: number, chroma: number, hue: number) => {
  const hueRadians = (hue * Math.PI) / 180;
  const okLabA = chroma * Math.cos(hueRadians);
  const okLabB = chroma * Math.sin(hueRadians);

  const long = lightness + 0.3963377774 * okLabA + 0.2158037573 * okLabB;
  const medium = lightness - 0.1055613458 * okLabA - 0.0638541728 * okLabB;
  const short = lightness - 0.0894841775 * okLabA - 1.291485548 * okLabB;

  const longLinear = long ** 3;
  const mediumLinear = medium ** 3;
  const shortLinear = short ** 3;

  const redLinear =
    4.0767416621 * longLinear -
    3.3077115913 * mediumLinear +
    0.2309699292 * shortLinear;
  const greenLinear =
    -1.2684380046 * longLinear +
    2.6097574011 * mediumLinear -
    0.3413193965 * shortLinear;
  const blueLinear =
    -0.0041960863 * longLinear -
    0.7034186147 * mediumLinear +
    1.707614701 * shortLinear;

  const toSrgbChannel = (value: number) =>
    value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;

  return [
    clampColorChannel(toSrgbChannel(redLinear) * 255),
    clampColorChannel(toSrgbChannel(greenLinear) * 255),
    clampColorChannel(toSrgbChannel(blueLinear) * 255),
  ] as const;
};

const parseOklchColor = (color: string) => {
  const match = /^oklch\(\s*(?<body>.+?)\s*\)$/iu.exec(color);
  const body = match?.groups?.body;

  if (!body) {
    return null;
  }

  const [channels] = body.split('/');
  const [lightnessValue, chromaValue, hueValue = '0'] =
    channels?.trim().split(/\s+/u) ?? [];

  if (!lightnessValue || !chromaValue) {
    return null;
  }

  const lightness = parseOklchNumber(lightnessValue);
  const chroma = parseOklchNumber(chromaValue);
  const hue = parseOklchHue(hueValue);

  if (lightness === null || chroma === null || !Number.isFinite(hue)) {
    return null;
  }

  return oklchToRgb(lightness, chroma, hue);
};

const cssColorToHex = (color: string) => {
  const trimmedColor = color.trim();
  const oklchRgb = parseOklchColor(trimmedColor);

  try {
    if (oklchRgb) {
      return Color.rgb(...oklchRgb).rgbNumber();
    }

    return Color(trimmedColor).rgbNumber();
  } catch {
    return DEFAULT_VIEWPORT_BACKGROUND_COLOR;
  }
};

export const usePixiScene = ({
  activeLayerId,
  brushTileId,
  clipboard,
  contextMenu,
  dragDelta,
  getHost,
  hoverCell,
  paintPreviewCells,
  selectedTool,
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
      y: (current.pan.y - screenPoint.y) / scale,
    };
  };

  const screenToCell = (current: PixiScene, screenPoint: Cell) => {
    const worldPoint = screenToWorld(current, screenPoint);

    return {
      x: Math.floor(worldPoint.x / TILE_SIZE),
      y: Math.floor(worldPoint.y / TILE_SIZE),
    };
  };

  const getViewportBackgroundColor = () =>
    cssColorToHex(getComputedStyle(getHost()).backgroundColor);

  const drawBackground = (current: PixiScene) => {
    const host = getHost();

    current.background.clear();
    current.background
      .rect(0, 0, host.clientWidth, host.clientHeight)
      .fill({ color: getViewportBackgroundColor() });
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
    const minY =
      Math.floor(Math.min(topLeft.y, bottomRight.y) / TILE_SIZE) * TILE_SIZE;
    const maxY =
      Math.ceil(Math.max(topLeft.y, bottomRight.y) / TILE_SIZE) * TILE_SIZE;

    current.grid.clear();

    const gridColor = cssColorToHex(getComputedStyle(getHost()).color);
    const axisColor = cssColorToHex(getComputedStyle(getHost()).borderColor);
    for (let x = minX; x <= maxX; x += TILE_SIZE) {
      current.grid
        .moveTo(x, minY)
        .lineTo(x, maxY)
        .stroke({
          color: x === 0 ? axisColor : gridColor,
          width: x === 0 ? lineWidth * 2 : lineWidth,
        });
    }

    for (let y = minY; y <= maxY; y += TILE_SIZE) {
      current.grid
        .moveTo(minX, y)
        .lineTo(maxX, y)
        .stroke({
          color: y === 0 ? axisColor : gridColor,
          width: y === 0 ? lineWidth * 2 : lineWidth,
        });
    }
  };

  const drawTiles = (current: PixiScene) => {
    const scale = zoom() / 100;
    const lineWidth = 1 / scale;
    const movingSelectedKeys = dragDelta()
      ? new Set(selection().map(coordinateKey))
      : null;

    current.tileLayer.clear();

    for (const layer of [...snapshot().layers].sort(
      (first, second) => first.order - second.order,
    )) {
      const isActiveLayer = layer.id === activeLayerId();

      for (const tile of layer.tiles) {
        if (isActiveLayer && movingSelectedKeys?.has(coordinateKey(tile))) {
          continue;
        }

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

    const menuState = contextMenu();

    if (menuState.open) {
      return;
    }

    const lineWidth = 1 / (zoom() / 100);

    if (selectedTool() === 'brush') {
      const previewCells = paintPreviewCells();
      const cells = previewCells.length > 0 ? previewCells : hoverCell();

      for (const cell of Array.isArray(cells) ? cells : cells ? [cells] : []) {
        const rect = getCellRect(cell);

        current.preview
          .rect(rect.x + 1, rect.y + 1, TILE_SIZE - 2, TILE_SIZE - 2)
          .fill({ color: tileColor(brushTileId()), alpha: 0.24 })
          .stroke({
            color: 0x38bdf8,
            alpha: 0.56,
            width: lineWidth,
          });
      }
      return;
    }

    if (selectedTool() === 'select') {
      return;
    }

    const currentClipboard = clipboard();
    const targetCell = hoverCell();

    if (!currentClipboard || !targetCell) {
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
          width: lineWidth,
        });
    }
  };

  const drawOverlay = (current: PixiScene) => {
    const scale = zoom() / 100;
    const lineWidth = 2 / scale;
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
      const selectedTile = current.overlay.rect(
        rect.x + 1,
        rect.y + 1,
        TILE_SIZE - 2,
        TILE_SIZE - 2,
      );

      if (delta) {
        selectedTile.fill({ color: tileColor(tile.tileId), alpha: 0.28 });
      }

      selectedTile.stroke({ color: 0xfacc15, alpha: 0.9, width: lineWidth });
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
  };

  const redrawScene = (current: PixiScene) => {
    const scale = zoom() / 100;

    current.world.position.set(current.pan.x, current.pan.y);
    current.world.scale.set(scale, -scale);

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
        background: getViewportBackgroundColor(),
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
