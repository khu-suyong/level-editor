import { useStore } from '@nanostores/solid';
import { Box } from '@suis-ui/kit';
import { createEffect, onCleanup, onMount } from 'solid-js';

import { PixiViewport } from '../components/pixi-viewport';
import type { LevelData, RecognitionPayload } from '../models/level';
import {
  editorStore,
  setActiveLayerId,
  setSelectedBrushTileId,
  setSelectedLayerId,
  setSelectedTool,
  setSelection,
  setZoom,
} from '../stores/editor';
import {
  canRedo,
  canUndo,
  currentSnapshot,
  initializeHistory,
  redoHistory,
  replaceLevel,
  undoHistory,
} from '../stores/history';
import {
  addEmptyLayerToBottom,
  deleteLayerFromLevel,
  getLayerDeleteFallbackId,
  type LayerMoveDirection,
  moveLayerInLevel,
  sortLayersForDisplay,
} from '../stores/layers';
import { insertRecognitionLayer } from '../stores/recognition';
import { PropertyPanel } from './_components/property-panel';
import { SidePanel } from './_components/side-panel';
import { ToolPanel } from './_components/tool-panel';
import * as styles from './index.css';

const defaultLevel: LevelData = {
  id: 'default-level',
  name: 'level name',
  tileTable: [
    {
      tileId: 0,
      name: 'Tile 0',
      backgroundColor: '#2563eb',
      icon: 'star',
      iconColor: '#f8fafc',
      cvShapes: [],
    },
  ],
  layers: [
    {
      id: 'base',
      name: 'Base',
      order: 0,
      tiles: [
        { x: 1, y: 1, tileId: 0 },
        { x: 2, y: 1, tileId: 0 },
        { x: 3, y: 1, tileId: 0 },
        { x: 5, y: 3, tileId: 0 },
        { x: 6, y: 3, tileId: 0 },
        { x: 7, y: 3, tileId: 0 },
        { x: 8, y: 3, tileId: 0 },
      ],
    },
  ],
};

initializeHistory(defaultLevel);

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.matches('input, textarea, select, button')
  );
};

export default function HomePage() {
  const editor = useStore(editorStore);
  const snapshot = useStore(currentSnapshot);
  const undoAvailable = useStore(canUndo);
  const redoAvailable = useStore(canRedo);
  const level = () => snapshot() ?? defaultLevel;
  const handleUndo = () => {
    undoHistory();
    setSelection([]);
  };
  const handleRedo = () => {
    redoHistory();
    setSelection([]);
  };
  const handleSelectLayer = (layerId: string) => {
    setActiveLayerId(layerId);
    setSelection([]);
  };
  const handleSelectLayerRect = (layerId: string, selected: boolean) => {
    setSelectedLayerId(selected ? layerId : null);
    setSelection([]);
  };
  const handleApplyLevel = (nextLevel: LevelData) => {
    replaceLevel(nextLevel);
    setSelection([]);
  };
  const handleAddLayer = () => {
    const result = addEmptyLayerToBottom(level());

    replaceLevel(result.level);
    setActiveLayerId(result.layer.id);
    setSelectedLayerId(result.layer.id);
    setSelection([]);
  };
  const handleMoveLayer = (layerId: string, direction: LayerMoveDirection) => {
    const nextLevel = moveLayerInLevel(level(), layerId, direction);

    if (!nextLevel) {
      return;
    }

    replaceLevel(nextLevel);
    setSelection([]);
  };
  const handleDeleteLayer = (layerId: string) => {
    const currentLevel = level();
    const currentEditor = editor();
    const fallbackLayerId = getLayerDeleteFallbackId(currentLevel, layerId);
    const nextLevel = deleteLayerFromLevel(currentLevel, layerId);

    if (!nextLevel) {
      return;
    }

    replaceLevel(nextLevel);

    if (currentEditor.activeLayerId === layerId && fallbackLayerId) {
      setActiveLayerId(fallbackLayerId);
    }

    if (currentEditor.selectedLayerId === layerId) {
      setSelectedLayerId(fallbackLayerId);
    }

    setSelection([]);
  };
  const handleInsertRecognitionPayload = async (
    payload: RecognitionPayload,
  ) => {
    const layerId = await insertRecognitionLayer(payload, {
      viewportWidth: window.innerWidth,
    });

    if (!layerId) {
      return null;
    }

    setActiveLayerId(layerId);
    setSelectedLayerId(layerId);
    setSelection([]);

    return layerId;
  };

  createEffect(() => {
    const currentLevel = level();
    const selectedBrushTileId = editor().selectedBrushTileId;

    if (
      currentLevel.tileTable.length > 0 &&
      !currentLevel.tileTable.some(
        (tile) => tile.tileId === selectedBrushTileId,
      )
    ) {
      setSelectedBrushTileId(currentLevel.tileTable[0].tileId);
    }
  });

  createEffect(() => {
    const currentLevel = level();
    const currentEditor = editor();
    const layerIds = new Set(currentLevel.layers.map((layer) => layer.id));
    const fallbackLayerId =
      sortLayersForDisplay(currentLevel.layers)[0]?.id ?? null;

    if (fallbackLayerId && !layerIds.has(currentEditor.activeLayerId)) {
      setActiveLayerId(fallbackLayerId);
    }

    if (
      currentEditor.selectedLayerId &&
      !layerIds.has(currentEditor.selectedLayerId)
    ) {
      setSelectedLayerId(null);
    }
  });

  onMount(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== 'z'
      ) {
        return;
      }

      event.preventDefault();

      if (event.shiftKey) {
        handleRedo();
        return;
      }

      handleUndo();
    };

    window.addEventListener('keydown', handleKeyDown);

    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });
  });

  return (
    <Box
      as={'main'}
      class={styles.shell}
      bg={'surface.main'}
      c={'text.main'}
      z={'0'}
    >
      <Box
        as={'section'}
        class={styles.canvasLayer}
        bg={'gray.950'}
        aria-label={'Level canvas'}
      >
        <PixiViewport snapshot={level()} />
      </Box>

      <SidePanel
        activeLayerId={editor().activeLayerId}
        selectedBrushTileId={editor().selectedBrushTileId}
        selectedLayerId={editor().selectedLayerId}
        level={level()}
        onApplyLevel={handleApplyLevel}
        onAddLayer={handleAddLayer}
        onDeleteLayer={handleDeleteLayer}
        onMoveLayer={handleMoveLayer}
        onSelectActiveLayer={handleSelectLayer}
        onSelectBrushTile={setSelectedBrushTileId}
        onSelectLayerRect={handleSelectLayerRect}
      />
      <ToolPanel
        canUndo={undoAvailable()}
        canRedo={redoAvailable()}
        selectedBrushTileId={editor().selectedBrushTileId}
        onUndo={handleUndo}
        onRedo={handleRedo}
        selectedTool={editor().selectedTool}
        tileTable={level().tileTable}
        onSelectBrushTile={setSelectedBrushTileId}
        onSelectTool={setSelectedTool}
      />
      <PropertyPanel
        zoom={editor().zoom}
        onZoomChange={setZoom}
        onInsertRecognitionPayload={handleInsertRecognitionPayload}
      />
    </Box>
  );
}
