import { useStore } from '@nanostores/solid';
import { Box } from '@suis-ui/kit';
import { onCleanup, onMount } from 'solid-js';

import { PixiViewport } from '../components/pixi-viewport';
import type { LevelData } from '../models/level';
import {
  editorStore,
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
  undoHistory,
} from '../stores/history';
import { PropertyPanel } from './_components/property-panel';
import { SidePanel } from './_components/side-panel';
import { ToolPanel } from './_components/tool-panel';
import * as styles from './index.css';

const defaultLevel: LevelData = {
  id: 'default-level',
  name: 'level name',
  tileTable: [{ tileId: 0, sourceTileId: 'default' }],
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
    <Box as={'main'} class={styles.shell} bg={'surface.main'} c={'text.main'}>
      <Box
        as={'section'}
        class={styles.canvasLayer}
        bg={'gray.950'}
        aria-label={'Level canvas'}
      >
        <PixiViewport snapshot={level()} />
      </Box>

      <SidePanel levelName={level().name} />
      <ToolPanel
        canUndo={undoAvailable()}
        canRedo={redoAvailable()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        selectedTool={editor().selectedTool}
        onSelectTool={setSelectedTool}
      />
      <PropertyPanel
        canvasReady={editor().canvasReady}
        selectedTool={editor().selectedTool}
        zoom={editor().zoom}
        onZoomChange={setZoom}
      />
    </Box>
  );
}
