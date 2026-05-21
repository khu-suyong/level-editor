import { Box, Button, Item } from '@suis-ui/kit';
import {
  ChevronDown,
  ChevronRight,
  Layers,
  Palette,
  Square,
} from 'lucide-solid';
import { createSignal, For, Show } from 'solid-js';
import { tileColor } from '@/components/pixi-viewport/util';
import { Icon } from '@/components/ui/icon';
import type { LevelData } from '@/models/level';
import * as styles from './side-panel.css';

type TreeGroupId = 'layers' | 'tiles';

type SidePanelProps = {
  activeLayerId: string;
  level: LevelData;
  selectedTileId: number;
  onSelectLayer: (layerId: string) => void;
  onSelectTile: (tileId: number) => void;
};

const hexColor = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

export function SidePanel(props: SidePanelProps) {
  const [expandedGroups, setExpandedGroups] = createSignal<
    Record<TreeGroupId, boolean>
  >({
    layers: true,
    tiles: true,
  });
  const layers = () =>
    [...props.level.layers].sort((first, second) => first.order - second.order);
  const isGroupExpanded = (groupId: TreeGroupId) => expandedGroups()[groupId];
  const toggleGroup = (groupId: TreeGroupId) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };
  const getLayerName = (layerId: string) =>
    props.level.layers.find((layer) => layer.id === layerId)?.name ?? layerId;
  const getTreeChevron = (groupId: TreeGroupId) =>
    isGroupExpanded(groupId) ? ChevronDown : ChevronRight;

  return (
    <Box
      as={'aside'}
      class={styles.panel}
      direction={'column'}
      gap={'md'}
      bg={'surface.high'}
      bc={'surface.higher'}
      bw={'thin'}
      aria-label={'Editor actions'}
    >
      <div class={styles.brandRow}>
        <Box class={styles.appMark} bg={'primary.main'} c={'primary.contrast'}>
          {'LE'}
        </Box>
        <Box minW={'0'}>
          <Box as={'h1'} class={styles.title} text={'body'} c={'text.main'}>
            {props.level.name}
          </Box>
          <Box
            as={'p'}
            class={styles.subtitle}
            text={'caption'}
            c={'text.caption'}
          >
            {'2D level editor'}
          </Box>
        </Box>
      </div>

      <div class={styles.actionRow}>
        <Button variant={'default'} size={'sm'}>
          {'New'}
        </Button>
        <Button variant={'default'} size={'sm'}>
          {'Save'}
        </Button>
        <Button variant={'primary'} size={'sm'}>
          {'Playtest'}
        </Button>
      </div>

      <Box as={'section'} direction={'column'} gap={'xs'}>
        <Box
          as={'h2'}
          class={styles.sectionTitle}
          text={'caption'}
          c={'text.caption'}
        >
          {'Explorer'}
        </Box>
        <Box as={'ul'} class={styles.treeList} role={'tree'}>
          <Box as={'li'} role={'none'}>
            <Item
              as={'button'}
              type={'button'}
              class={styles.treeItem}
              role={'treeitem'}
              aria-expanded={isGroupExpanded('layers')}
              media={
                <span class={styles.treeItemMedia}>
                  <Icon name={getTreeChevron('layers')} size={14} />
                  <Icon name={Layers} size={15} />
                </span>
              }
              title={'Layers'}
              description={`${layers().length} layer`}
              action={getLayerName(props.activeLayerId)}
              size={'sm'}
              w={'100%'}
              onClick={() => toggleGroup('layers')}
            />
            <Show when={isGroupExpanded('layers')}>
              <Box
                as={'ul'}
                class={styles.treeChildList}
                role={'group'}
                aria-label={'Layers'}
              >
                <For each={layers()}>
                  {(layer) => {
                    const isActive = () => props.activeLayerId === layer.id;

                    return (
                      <Box as={'li'} class={styles.treeChildItem} role={'none'}>
                        <Item
                          as={'button'}
                          type={'button'}
                          class={styles.treeItem}
                          classList={{ [styles.treeItemActive]: isActive() }}
                          role={'treeitem'}
                          aria-selected={isActive()}
                          media={<Icon name={Square} size={14} />}
                          title={layer.name}
                          description={layer.id}
                          action={`${layer.tiles.length}`}
                          size={'sm'}
                          w={'100%'}
                          onClick={() => props.onSelectLayer(layer.id)}
                        />
                      </Box>
                    );
                  }}
                </For>
              </Box>
            </Show>
          </Box>

          <Box as={'li'} role={'none'}>
            <Item
              as={'button'}
              type={'button'}
              class={styles.treeItem}
              role={'treeitem'}
              aria-expanded={isGroupExpanded('tiles')}
              media={
                <span class={styles.treeItemMedia}>
                  <Icon name={getTreeChevron('tiles')} size={14} />
                  <Icon name={Palette} size={15} />
                </span>
              }
              title={'Tiles'}
              description={`${props.level.tileTable.length} source`}
              action={`#${props.selectedTileId}`}
              size={'sm'}
              w={'100%'}
              onClick={() => toggleGroup('tiles')}
            />
            <Show when={isGroupExpanded('tiles')}>
              <Box
                as={'ul'}
                class={styles.treeChildList}
                role={'group'}
                aria-label={'Tiles'}
              >
                <For each={props.level.tileTable}>
                  {(tile) => {
                    const isSelected = () =>
                      props.selectedTileId === tile.tileId;

                    return (
                      <Box as={'li'} class={styles.treeChildItem} role={'none'}>
                        <Item
                          as={'button'}
                          type={'button'}
                          class={styles.treeItem}
                          classList={{
                            [styles.treeItemActive]: isSelected(),
                          }}
                          role={'treeitem'}
                          aria-selected={isSelected()}
                          media={
                            <span
                              class={styles.tileSwatch}
                              style={{
                                'background-color': hexColor(
                                  tileColor(tile.tileId),
                                ),
                              }}
                            />
                          }
                          title={tile.sourceTileId}
                          description={`tile ${tile.tileId}`}
                          action={`#${tile.tileId}`}
                          size={'sm'}
                          w={'100%'}
                          onClick={() => props.onSelectTile(tile.tileId)}
                        />
                      </Box>
                    );
                  }}
                </For>
              </Box>
            </Show>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
