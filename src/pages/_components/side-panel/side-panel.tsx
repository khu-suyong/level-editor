import { Box, Button, vars } from '@suis-ui/kit';
import { FileDown, FileUp, Menu } from 'lucide-solid';
import { createSignal, For, type JSX } from 'solid-js';

import { Icon } from '@/components/ui/icon';
import { MenuButton } from '@/components/ui/menu-button';
import type { LevelData } from '@/models/level';
import type { LayerMoveDirection } from '@/stores/layers';
import { LEVEL_FILE_ACCEPT } from '@/stores/level-file';
import { LayerTab } from './layer-tab';
import { PaletteTab } from './palette-tab';
import * as styles from './side-panel.css';

type SidePanelTab = 'layer' | 'palette';

const sidePanelTabs = ['layer', 'palette'] as const satisfies SidePanelTab[];

type SidePanelProps = {
  activeLayerId: string;
  levelLoadPending: boolean;
  selectedBrushTileId: number;
  selectedLayerId: string | null;
  level: LevelData;
  onApplyLevel: (level: LevelData) => void;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onLoadLevelFile: (file: File) => void;
  onMoveLayer: (layerId: string, direction: LayerMoveDirection) => void;
  onSaveLevel: () => void;
  onSelectActiveLayer: (layerId: string) => void;
  onSelectBrushTile: (tileId: number) => void;
  onSelectLayerRect: (layerId: string, selected: boolean) => void;
};

export const SidePanel = (props: SidePanelProps) => {
  let levelFileInput: HTMLInputElement | undefined;
  const [activeTab, setActiveTab] = createSignal<SidePanelTab>('layer');
  const getTabIndex = (tab: SidePanelTab) => sidePanelTabs.indexOf(tab);
  const activeTabIndex = () => getTabIndex(activeTab());
  const selectTab = (tab: SidePanelTab) => {
    setActiveTab(tab);
  };
  const handleOpenLevelFileInput = () => {
    if (props.levelLoadPending) {
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

    props.onLoadLevelFile(file);
  };

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
            },
            {
              label: '레벨 불러오기',
              disabled: props.levelLoadPending,
              icon: FileUp,
              onClick: handleOpenLevelFileInput,
            },
          ]}
        >
          <Icon name={Menu} />
        </MenuButton>
        <Box text={'body'}>{props.level.name}</Box>
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
              selectedBrushTileId={props.selectedBrushTileId}
              onApplyLevel={props.onApplyLevel}
              onSelectBrushTile={props.onSelectBrushTile}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
