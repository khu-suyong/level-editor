import { Box, Button, Input, vars } from '@suis-ui/kit';
import { FileDown, FileOutput, FileUp, Menu, Save, X } from 'lucide-solid';
import { createEffect, createSignal, For, type JSX } from 'solid-js';

import { Icon } from '@/components/ui/icon';
import { MenuButton } from '@/components/ui/menu-button';
import {
  getShortcutAriaKeys,
  getShortcutDisplay,
  shortcutById,
} from '@/helpers/editor-shortcuts';
import type { LevelData } from '@/models/level';
import type { LayerMoveDirection } from '@/stores/layers';
import { LayerTab } from './layer-tab';
import { PaletteTab } from './palette-tab';
import * as styles from './side-panel.css';

type SidePanelTab = 'layer' | 'palette';

const sidePanelTabs = ['layer', 'palette'] as const satisfies SidePanelTab[];

type SidePanelProps = {
  activeLayerId: string;
  levelLoadPending: boolean;
  selectedBrushTileLabel: string;
  selectedLayerId: string | null;
  level: LevelData;
  onApplyLevel: (level: LevelData) => void;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onExportUnrealLevel: () => void;
  onMoveLayer: (layerId: string, direction: LayerMoveDirection) => void;
  onOpenLevelFile: () => void;
  onRenameLayer: (layerId: string, name: string) => string | null;
  onRenameLevel: (name: string) => void;
  onSaveLevel: () => void;
  onSelectActiveLayer: (layerId: string) => void;
  onSelectBrushTile: (tileLabel: string) => void;
  onSelectLayerRect: (layerId: string, selected: boolean) => void;
};

export const SidePanel = (props: SidePanelProps) => {
  let levelNameInput: HTMLInputElement | undefined;
  const [activeTab, setActiveTab] = createSignal<SidePanelTab>('layer');
  const [levelNameEditing, setLevelNameEditing] = createSignal(false);
  const [levelNameDraft, setLevelNameDraft] = createSignal(props.level.name);
  const [levelNameError, setLevelNameError] = createSignal<string | null>(null);
  const getTabIndex = (tab: SidePanelTab) => sidePanelTabs.indexOf(tab);
  const activeTabIndex = () => getTabIndex(activeTab());
  const selectTab = (tab: SidePanelTab) => {
    setActiveTab(tab);
  };
  const focusLevelNameInput = () => {
    queueMicrotask(() => {
      levelNameInput?.focus();
      levelNameInput?.select();
    });
  };
  const handleStartLevelNameEdit = () => {
    setLevelNameDraft(props.level.name);
    setLevelNameError(null);
    setLevelNameEditing(true);
    focusLevelNameInput();
  };
  const handleCancelLevelNameEdit = () => {
    setLevelNameDraft(props.level.name);
    setLevelNameError(null);
    setLevelNameEditing(false);
  };
  const handleSaveLevelName = () => {
    const nextName = levelNameDraft().trim();

    if (!nextName) {
      setLevelNameError('이름을 입력하세요.');
      focusLevelNameInput();
      return;
    }

    if (nextName !== props.level.name) {
      props.onRenameLevel(nextName);
    }

    setLevelNameDraft(nextName);
    setLevelNameError(null);
    setLevelNameEditing(false);
  };
  const handleLevelNameKeyDown: JSX.EventHandler<
    HTMLInputElement,
    KeyboardEvent
  > = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSaveLevelName();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancelLevelNameEdit();
    }
  };

  createEffect(() => {
    if (levelNameEditing()) {
      return;
    }

    setLevelNameDraft(props.level.name);
  });

  return (
    <Box
      as={'aside'}
      class={styles.panel}
      pos={'absolute'}
      z={10}
      top={vars.size.space.lg}
      left={vars.size.space.lg}
      direction={'column'}
      gap={'md'}
      w={'26rem'}
      maxH={`calc(100vh - (${vars.size.space.lg} * 2))`}
      overflow={'auto'}
      bg={'surface.high'}
      bc={'surface.higher'}
      bd={'thin'}
      p={'xs'}
      r={'lg'}
      shadow={'xl'}
      aria-label={'Level structure'}
    >
      <Box
        pos={'sticky'}
        direction={'row'}
        align={'center'}
        gap={'xs'}
        top={'0'}
      >
        <MenuButton
          variant={'ghost'}
          type={'icon'}
          size={'sm'}
          r={'md'}
          aria-label={'레벨 파일 메뉴'}
          placement={'bottom-start'}
          items={[
            {
              label: '레벨 저장',
              icon: FileDown,
              onClick: props.onSaveLevel,
              shortcut: getShortcutDisplay(shortcutById['save-level']),
              ariaKeyShortcuts: getShortcutAriaKeys(shortcutById['save-level']),
            },
            {
              label: 'UE Export',
              icon: FileOutput,
              onClick: props.onExportUnrealLevel,
            },
            {
              label: '레벨 불러오기',
              disabled: props.levelLoadPending,
              icon: FileUp,
              onClick: props.onOpenLevelFile,
              shortcut: getShortcutDisplay(shortcutById['open-level']),
              ariaKeyShortcuts: getShortcutAriaKeys(shortcutById['open-level']),
            },
          ]}
        >
          <Icon name={Menu} />
        </MenuButton>
        <Box flex minW={'0'} gap={'xxs'}>
          {levelNameEditing() ? (
            <>
              <Box
                w={'100%'}
                minW={'0'}
                direction={'row'}
                align={'center'}
                gap={'xxs'}
              >
                <Input
                  ref={(element) => {
                    levelNameInput = element;
                  }}
                  flex
                  minW={'0'}
                  value={levelNameDraft()}
                  aria-label={'레벨 이름'}
                  style={{
                    'min-width': '0',
                    width: '0',
                  }}
                  onInput={(event) => {
                    setLevelNameDraft(event.currentTarget.value);
                    setLevelNameError(null);
                  }}
                  onKeyDown={handleLevelNameKeyDown}
                />
                <Button
                  variant={'ghost'}
                  type={'icon'}
                  size={'sm'}
                  r={'md'}
                  flex={'0 0 auto'}
                  aria-label={'레벨 이름 저장'}
                  onClick={handleSaveLevelName}
                >
                  <Icon name={Save} />
                </Button>
                <Button
                  variant={'ghost'}
                  type={'icon'}
                  size={'sm'}
                  r={'md'}
                  flex={'0 0 auto'}
                  aria-label={'레벨 이름 변경 취소'}
                  onClick={handleCancelLevelNameEdit}
                >
                  <Icon name={X} />
                </Button>
              </Box>
              <Box
                minH={vars.font.caption.lineHeight}
                text={'caption'}
                c={'error.main'}
              >
                {levelNameError() ?? ' '}
              </Box>
            </>
          ) : (
            <Button
              flex
              minW={'0'}
              variant={'ghost'}
              size={'sm'}
              justify={'flex-start'}
              title={props.level.name}
              aria-label={'레벨 이름 변경'}
              onClick={handleStartLevelNameEdit}
            >
              <Box
                as={'span'}
                minW={'0'}
                overflow={'hidden'}
                style={{
                  'text-overflow': 'ellipsis',
                  'white-space': 'nowrap',
                }}
              >
                {props.level.name}
              </Box>
            </Button>
          )}
        </Box>
      </Box>
      <Box
        direction={'row'}
        gap={'xs'}
        role={'tablist'}
        aria-label={'Sidebar tabs'}
      >
        <For each={sidePanelTabs}>
          {(tab) => (
            <Button
              flex
              variant={'ghost'}
              active={activeTab() === tab}
              aria-selected={activeTab() === tab}
              role={'tab'}
              onClick={() => selectTab(tab)}
            >
              {tab === 'layer' ? 'Layer' : 'Palette'}
            </Button>
          )}
        </For>
      </Box>
      <Box minW={'0'} overflow={'xHidden'}>
        <Box
          class={styles.pagerTrack}
          direction={'row'}
          align={'flex-start'}
          w={'200%'}
          style={{
            transform: `translateX(${activeTabIndex() * -50}%)`,
          }}
        >
          <Box
            w={'50%'}
            minW={'0'}
            flex={'0 0 50%'}
            aria-hidden={activeTab() !== 'layer'}
            style={{
              'pointer-events': activeTab() === 'layer' ? 'auto' : 'none',
            }}
          >
            <LayerTab
              activeLayerId={props.activeLayerId}
              selectedLayerId={props.selectedLayerId}
              level={props.level}
              onAddLayer={props.onAddLayer}
              onDeleteLayer={props.onDeleteLayer}
              onMoveLayer={props.onMoveLayer}
              onRenameLayer={props.onRenameLayer}
              onSelectActiveLayer={props.onSelectActiveLayer}
              onSelectLayerRect={props.onSelectLayerRect}
            />
          </Box>
          <Box
            w={'50%'}
            minW={'0'}
            flex={'0 0 50%'}
            aria-hidden={activeTab() !== 'palette'}
            style={{
              'pointer-events': activeTab() === 'palette' ? 'auto' : 'none',
            }}
          >
            <PaletteTab
              level={props.level}
              selectedBrushTileLabel={props.selectedBrushTileLabel}
              onApplyLevel={props.onApplyLevel}
              onSelectBrushTile={props.onSelectBrushTile}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
