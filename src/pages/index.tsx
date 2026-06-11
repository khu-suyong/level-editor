import { useStore } from '@nanostores/solid';
import { Box, Button } from '@suis-ui/kit';
import { createMutation } from '@tanstack/solid-query';
import {
  createEffect,
  createSignal,
  type JSX,
  onCleanup,
  onMount,
} from 'solid-js';

import { uploadRecognitionImage } from '@/api/recognitions';
import { Dialog } from '@/components/ui/dialog';
import {
  editorToolShortcutActionIds,
  getShortcutMatch,
  type ShortcutActionId,
  type ShortcutMatch,
  shortcutById,
  shouldIgnoreShortcutEvent,
} from '@/helpers/editor-shortcuts';
import { clampGridSize, DEFAULT_GRID_SIZE } from '@/helpers/grid-size';
import { PixiViewport } from '../components/pixi-viewport';
import type {
  LevelData,
  RecognitionPayload,
  TileMapping,
} from '../models/level';
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
  renameLevel,
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
import {
  getLevelFileName,
  LEVEL_FILE_ACCEPT,
  parseLevelFileText,
  serializeLevelData,
} from '../stores/level-file';
import { updatePaletteTileInLevel } from '../stores/palette';
import {
  getNonTerrainStructureTileMapping,
  insertRecognitionLayer,
} from '../stores/recognition';
import { createEmptyTerrainExportTileLabels } from '../stores/terrain';
import {
  getUnrealExportFileName,
  serializeUnrealExportData,
} from '../stores/unreal-export';
import { PropertyPanel } from './_components/property-panel';
import { RecognitionResultDialog } from './_components/recognition-result-dialog';
import { ShortcutHelpDialog } from './_components/shortcut-help-dialog';
import { SidePanel } from './_components/side-panel';
import { ToolPanel } from './_components/tool-panel';

const defaultLevel: LevelData = {
  id: 'default-level',
  name: 'level name',
  gridSize: DEFAULT_GRID_SIZE,
  tileTable: [
    {
      tileId: 0,
      name: 'Tile 0',
      backgroundColor: '#2563eb',
      icon: 'star',
      iconColor: '#f8fafc',
      showBackground: true,
      showIcon: true,
      cvShapes: [],
      isTerrain: false,
      terrainExportTileLabels: {
        center: '',
        top: '',
        bottom: '',
        left: '',
        right: '',
        topLeft: '',
        topRight: '',
        bottomLeft: '',
        bottomRight: '',
      },
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

type PendingLevelFile = {
  fileName: string;
  level: LevelData;
};

type StructureTerrainConfirmation = {
  payload: RecognitionPayload;
  tile: TileMapping;
  resolve: (convertToTerrain: boolean) => void;
};

const browserDefaultShortcutIds = new Set<ShortcutActionId>([
  'save-level',
  'open-level',
  'import-recognition',
]);

const downloadJsonFile = (fileName: string, content: string) => {
  const blob = new Blob([content], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export default function HomePage() {
  let levelFileInput: HTMLInputElement | undefined;
  let recognitionImageInput: HTMLInputElement | undefined;
  const editor = useStore(editorStore);
  const snapshot = useStore(currentSnapshot);
  const undoAvailable = useStore(canUndo);
  const redoAvailable = useStore(canRedo);
  const [recognitionPayloads, setRecognitionPayloads] = createSignal<
    RecognitionPayload[]
  >([]);
  const [recognitionResultsOpen, setRecognitionResultsOpen] =
    createSignal(false);
  const [recognitionApiError, setRecognitionApiError] = createSignal<
    string | null
  >(null);
  const [levelFileLoadPending, setLevelFileLoadPending] = createSignal(false);
  const [pendingLevelFile, setPendingLevelFile] =
    createSignal<PendingLevelFile | null>(null);
  const [structureTerrainConfirmation, setStructureTerrainConfirmation] =
    createSignal<StructureTerrainConfirmation | null>(null);
  const [levelFileError, setLevelFileError] = createSignal<string | null>(null);
  const [unrealExportError, setUnrealExportError] = createSignal<string | null>(
    null,
  );
  const [draftGridSize, setDraftGridSize] = createSignal<number | null>(null);
  const [shortcutHelpOpen, setShortcutHelpOpen] = createSignal(false);
  const level = () => snapshot() ?? defaultLevel;
  const gridSize = () => draftGridSize() ?? level().gridSize;
  const recognitionUploadMutation = createMutation<
    RecognitionPayload[],
    Error,
    File
  >(() => ({
    mutationFn: uploadRecognitionImage,
    onMutate: () => {
      setRecognitionApiError(null);
      setRecognitionResultsOpen(false);
    },
    onSuccess: (payloads) => {
      setRecognitionPayloads(payloads);
      setRecognitionResultsOpen(true);
    },
    onError: (error) => {
      setRecognitionApiError(error.message);
    },
  }));
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
  const handleRenameLevel = (name: string) => {
    renameLevel(name);
  };
  const handleSaveLevel = () => {
    const currentLevel = level();

    downloadJsonFile(
      getLevelFileName(currentLevel),
      serializeLevelData(currentLevel),
    );
  };
  const handleExportUnrealLevel = () => {
    const currentLevel = level();

    try {
      downloadJsonFile(
        getUnrealExportFileName(currentLevel),
        serializeUnrealExportData(currentLevel),
      );
      setUnrealExportError(null);
    } catch (error) {
      setUnrealExportError(
        error instanceof Error
          ? error.message
          : 'UE Export JSON을 생성하지 못했습니다.',
      );
    }
  };
  const handleOpenLevelFile = () => {
    if (levelFileLoadPending()) {
      return;
    }

    levelFileInput?.click();
  };
  const handleLevelFileChange: JSX.EventHandler<HTMLInputElement, Event> = (
    event,
  ) => {
    const file = event.currentTarget.files?.[0] ?? null;

    event.currentTarget.value = '';

    if (!file) {
      return;
    }

    void handleLoadLevelFile(file);
  };
  const handleLoadLevelFile = async (file: File) => {
    setLevelFileError(null);
    setPendingLevelFile(null);
    setLevelFileLoadPending(true);

    try {
      const text = await file.text();
      const nextLevel = parseLevelFileText(text);

      setPendingLevelFile({
        fileName: file.name,
        level: nextLevel,
      });
    } catch (error) {
      setLevelFileError(
        error instanceof Error
          ? error.message
          : '레벨 파일을 불러오지 못했습니다.',
      );
    } finally {
      setLevelFileLoadPending(false);
    }
  };
  const handleCancelLoadLevel = () => {
    setPendingLevelFile(null);
  };
  const handleConfirmLoadLevel = () => {
    const pending = pendingLevelFile();

    if (!pending) {
      return;
    }

    initializeHistory(pending.level);
    setActiveLayerId(
      sortLayersForDisplay(pending.level.layers)[0]?.id ?? 'base',
    );
    setSelectedLayerId(null);
    setSelection([]);
    setPendingLevelFile(null);
  };
  const handleCloseLevelFileError = () => {
    setLevelFileError(null);
  };
  const handleCloseUnrealExportError = () => {
    setUnrealExportError(null);
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
  const insertRecognitionPayload = async (payload: RecognitionPayload) => {
    const layerId = await insertRecognitionLayer(payload, {
      tileSize: level().gridSize,
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
  const requestStructureTerrainConfirmation = (
    payload: RecognitionPayload,
    tile: TileMapping,
  ) =>
    new Promise<boolean>((resolve) => {
      setStructureTerrainConfirmation({
        payload,
        tile,
        resolve,
      });
    });
  const resolveStructureTerrainConfirmation = (convertToTerrain: boolean) => {
    const pending = structureTerrainConfirmation();

    if (!pending) {
      return;
    }

    setStructureTerrainConfirmation(null);
    pending.resolve(convertToTerrain);
  };
  const handleKeepStructureTileAsObject = () => {
    resolveStructureTerrainConfirmation(false);
  };
  const handleConvertStructureTileToTerrain = () => {
    resolveStructureTerrainConfirmation(true);
  };
  const getStructureTerrainConfirmationMessage = () => {
    const pending = structureTerrainConfirmation();

    if (!pending) {
      return '';
    }

    return `structure 타입이 기존 팔레트 타일 "${pending.tile.name}"에 매핑되어 있습니다. 이 타일을 지형으로 바꿀까요?`;
  };
  const convertStructureTileToTerrain = (tileId: number) => {
    const currentLevel = level();
    const currentTile = currentLevel.tileTable.find(
      (tile) => tile.tileId === tileId,
    );

    if (!currentTile) {
      return;
    }

    replaceLevel(
      updatePaletteTileInLevel(currentLevel, currentTile.tileId, {
        ...currentTile,
        isTerrain: true,
        terrainExportTileLabels:
          currentTile.terrainExportTileLabels ??
          createEmptyTerrainExportTileLabels(),
      }),
    );
  };
  const handleInsertRecognitionPayload = async (
    payload: RecognitionPayload,
  ) => {
    const structureTile = getNonTerrainStructureTileMapping(level(), payload);

    if (structureTile) {
      const convertToTerrain = await requestStructureTerrainConfirmation(
        payload,
        structureTile,
      );

      if (convertToTerrain) {
        convertStructureTileToTerrain(structureTile.tileId);
      }
    }

    return insertRecognitionPayload(payload);
  };
  const handleImportRecognitionImage = (file: File) => {
    recognitionUploadMutation.mutate(file);
  };
  const handleOpenRecognitionImage = () => {
    if (recognitionUploadMutation.isPending) {
      return;
    }

    recognitionImageInput?.click();
  };
  const handleRecognitionImageChange: JSX.EventHandler<
    HTMLInputElement,
    Event
  > = (event) => {
    const file = event.currentTarget.files?.[0] ?? null;

    event.currentTarget.value = '';

    if (!file) {
      return;
    }

    handleImportRecognitionImage(file);
  };
  const handleCloseRecognitionResults = () => {
    setRecognitionResultsOpen(false);
  };
  const handleCloseRecognitionApiError = () => {
    setRecognitionApiError(null);
  };
  const handleGridSizePreviewChange = (nextGridSize: number) => {
    setDraftGridSize(clampGridSize(nextGridSize));
  };
  const handleGridSizeCommit = (nextGridSize: number) => {
    const committedGridSize = clampGridSize(nextGridSize);

    setDraftGridSize(null);

    if (level().gridSize === committedGridSize) {
      return;
    }

    replaceLevel({
      ...level(),
      gridSize: committedGridSize,
    });
  };
  const handleOpenShortcutHelp = () => {
    setShortcutHelpOpen(true);
  };
  const handleCloseShortcutHelp = () => {
    setShortcutHelpOpen(false);
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
    const findGlobalShortcut = (event: KeyboardEvent): ShortcutMatch | null => {
      const saveMatch = getShortcutMatch(event, shortcutById['save-level']);

      if (saveMatch) {
        return saveMatch;
      }

      const openMatch = getShortcutMatch(event, shortcutById['open-level']);

      if (openMatch) {
        return openMatch;
      }

      const recognitionMatch = getShortcutMatch(
        event,
        shortcutById['import-recognition'],
      );

      if (recognitionMatch) {
        return recognitionMatch;
      }

      const helpMatch = getShortcutMatch(
        event,
        shortcutById['open-shortcut-help'],
      );

      if (helpMatch) {
        return helpMatch;
      }

      const redoMatch = getShortcutMatch(event, shortcutById.redo);

      if (redoMatch) {
        return redoMatch;
      }

      const undoMatch = getShortcutMatch(event, shortcutById.undo);

      if (undoMatch) {
        return undoMatch;
      }

      for (const tool of Object.keys(editorToolShortcutActionIds) as Array<
        keyof typeof editorToolShortcutActionIds
      >) {
        const shortcut = shortcutById[editorToolShortcutActionIds[tool]];
        const toolMatch = getShortcutMatch(event, shortcut);

        if (toolMatch) {
          return toolMatch;
        }
      }

      return null;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const match = findGlobalShortcut(event);

      if (!match) {
        return;
      }

      if (shouldIgnoreShortcutEvent(event, match)) {
        if (browserDefaultShortcutIds.has(match.shortcut.id)) {
          event.preventDefault();
        }

        return;
      }

      event.preventDefault();

      if (event.repeat) {
        return;
      }

      if (match.shortcut.id === 'save-level') {
        handleSaveLevel();
        return;
      }

      if (match.shortcut.id === 'open-level') {
        handleOpenLevelFile();
        return;
      }

      if (match.shortcut.id === 'import-recognition') {
        handleOpenRecognitionImage();
        return;
      }

      if (match.shortcut.id === 'open-shortcut-help') {
        handleOpenShortcutHelp();
        return;
      }

      if (match.shortcut.id === 'redo') {
        handleRedo();
        return;
      }

      if (match.shortcut.id === 'undo') {
        handleUndo();
        return;
      }

      const tool = Object.entries(editorToolShortcutActionIds).find(
        ([, actionId]) => actionId === match.shortcut.id,
      )?.[0];

      if (tool) {
        setSelectedTool(tool as keyof typeof editorToolShortcutActionIds);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });
  });

  return (
    <Box
      as={'main'}
      pos={'relative'}
      w={'100vw'}
      h={'100vh'}
      overflow={'hidden'}
      bg={'surface.main'}
      c={'text.main'}
      z={'0'}
    >
      <input
        ref={(element) => {
          levelFileInput = element;
        }}
        type={'file'}
        accept={LEVEL_FILE_ACCEPT}
        aria-label={'Level JSON file'}
        hidden
        onChange={handleLevelFileChange}
      />
      <input
        ref={(element) => {
          recognitionImageInput = element;
        }}
        type={'file'}
        accept={'image/*'}
        aria-label={'Recognition image file'}
        hidden
        onChange={handleRecognitionImageChange}
      />
      <Box
        as={'section'}
        pos={'absolute'}
        top={'0'}
        right={'0'}
        bottom={'0'}
        left={'0'}
        minW={'0'}
        minH={'0'}
        bg={'gray.950'}
        aria-label={'Level canvas'}
      >
        <PixiViewport snapshot={level()} gridSize={gridSize()} />
      </Box>

      <SidePanel
        activeLayerId={editor().activeLayerId}
        levelLoadPending={levelFileLoadPending()}
        selectedBrushTileId={editor().selectedBrushTileId}
        selectedLayerId={editor().selectedLayerId}
        level={level()}
        onApplyLevel={handleApplyLevel}
        onAddLayer={handleAddLayer}
        onDeleteLayer={handleDeleteLayer}
        onExportUnrealLevel={handleExportUnrealLevel}
        onMoveLayer={handleMoveLayer}
        onOpenLevelFile={handleOpenLevelFile}
        onRenameLevel={handleRenameLevel}
        onSaveLevel={handleSaveLevel}
        onSelectActiveLayer={handleSelectLayer}
        onSelectBrushTile={setSelectedBrushTileId}
        onSelectLayerRect={handleSelectLayerRect}
      />
      <ToolPanel
        canUndo={undoAvailable()}
        canRedo={redoAvailable()}
        recognitionImportPending={recognitionUploadMutation.isPending}
        selectedBrushTileId={editor().selectedBrushTileId}
        onOpenRecognitionImage={handleOpenRecognitionImage}
        onUndo={handleUndo}
        onRedo={handleRedo}
        selectedTool={editor().selectedTool}
        tileTable={level().tileTable}
        onSelectBrushTile={setSelectedBrushTileId}
        onSelectTool={setSelectedTool}
      />
      <PropertyPanel
        gridSize={gridSize()}
        zoom={editor().zoom}
        onGridSizeCommit={handleGridSizeCommit}
        onGridSizePreviewChange={handleGridSizePreviewChange}
        onZoomChange={setZoom}
      />
      <RecognitionResultDialog
        open={recognitionResultsOpen()}
        level={level()}
        payloads={recognitionPayloads()}
        onClose={
          structureTerrainConfirmation()
            ? handleKeepStructureTileAsObject
            : handleCloseRecognitionResults
        }
        onInsertPayload={handleInsertRecognitionPayload}
      />
      <Dialog
        open={Boolean(structureTerrainConfirmation())}
        title={'지형 타일 전환'}
        onClose={handleKeepStructureTileAsObject}
        closeOnBackdrop={false}
        footer={
          <>
            <Button variant={'ghost'} onClick={handleKeepStructureTileAsObject}>
              {'그대로 삽입'}
            </Button>
            <Button
              variant={'primary'}
              onClick={handleConvertStructureTileToTerrain}
            >
              {'지형으로 전환'}
            </Button>
          </>
        }
      >
        <Box text={'body'}>{getStructureTerrainConfirmationMessage()}</Box>
      </Dialog>
      <ShortcutHelpDialog
        open={shortcutHelpOpen()}
        onClose={handleCloseShortcutHelp}
      />
      <Dialog
        open={Boolean(pendingLevelFile())}
        title={'레벨 불러오기'}
        description={
          pendingLevelFile()
            ? `${pendingLevelFile()?.fileName} 파일로 현재 레벨을 교체합니다.`
            : undefined
        }
        onClose={handleCancelLoadLevel}
        footer={
          <>
            <Button variant={'ghost'} onClick={handleCancelLoadLevel}>
              {'취소'}
            </Button>
            <Button variant={'primary'} onClick={handleConfirmLoadLevel}>
              {'불러오기'}
            </Button>
          </>
        }
      >
        <Box text={'body'}>
          {
            '현재 편집 내용과 실행 취소 기록이 불러온 레벨 기준으로 초기화됩니다.'
          }
        </Box>
      </Dialog>
      <Dialog
        open={Boolean(levelFileError())}
        title={'레벨 파일 오류'}
        description={levelFileError() ?? undefined}
        onClose={handleCloseLevelFileError}
        footer={
          <Button variant={'primary'} onClick={handleCloseLevelFileError}>
            {'확인'}
          </Button>
        }
      >
        <Box text={'body'}>{'레벨 파일을 불러오지 못했습니다.'}</Box>
      </Dialog>
      <Dialog
        open={Boolean(unrealExportError())}
        title={'UE Export 오류'}
        description={unrealExportError() ?? undefined}
        onClose={handleCloseUnrealExportError}
        footer={
          <Button variant={'primary'} onClick={handleCloseUnrealExportError}>
            {'확인'}
          </Button>
        }
      >
        <Box text={'body'}>{'UE Export JSON을 생성하지 못했습니다.'}</Box>
      </Dialog>
      <Dialog
        open={Boolean(recognitionApiError())}
        title={'인식 API 실패'}
        description={recognitionApiError() ?? undefined}
        onClose={handleCloseRecognitionApiError}
        footer={
          <Button variant={'primary'} onClick={handleCloseRecognitionApiError}>
            {'확인'}
          </Button>
        }
      >
        <Box text={'body'}>{'이미지 인식 데이터를 가져오지 못했습니다.'}</Box>
      </Dialog>
    </Box>
  );
}
