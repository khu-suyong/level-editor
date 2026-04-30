import { Box, Button } from '@suis-ui/kit';
import {
  Eraser,
  Hand,
  MousePointer2,
  Paintbrush,
  Redo2,
  Undo2,
} from 'lucide-solid';
import { For } from 'solid-js';

import { Icon, type IconType } from '@/components/ui/icon';
import type { EditorTool } from '@/stores/editor';
import * as styles from './tool-panel.css';

const tools = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'brush', label: 'Brush', icon: Paintbrush },
  { id: 'erase', label: 'Erase', icon: Eraser },
  { id: 'pan', label: 'Pan', icon: Hand },
] as const satisfies ReadonlyArray<{
  id: EditorTool;
  label: string;
  icon: IconType;
}>;

type ToolPanelProps = {
  canRedo: boolean;
  canUndo: boolean;
  onRedo: () => void;
  selectedTool: EditorTool;
  onUndo: () => void;
  onSelectTool: (selectedTool: EditorTool) => void;
};

export function ToolPanel(props: ToolPanelProps) {
  return (
    <Box as={'aside'} class={styles.containerStyle}>
      <Box class={styles.groupStyle} aria-label={'Editor toolbar'}>
        <Box
          direction={'row'}
          aria-label={'History actions'}
        >
          <Button
            variant={'ghost'}
            size={'md'}
            p={'sm'}
            type={'icon'}
            disabled={!props.canUndo}
            title={'Undo'}
            aria-label={'Undo'}
            onClick={props.onUndo}
          >
            <Icon name={Undo2} size={'1.6rem'} />
          </Button>
          <Button
            variant={'ghost'}
            size={'md'}
            p={'sm'}
            type={'icon'}
            disabled={!props.canRedo}
            title={'Redo'}
            aria-label={'Redo'}
            onClick={props.onRedo}
          >
            <Icon name={Redo2} size={'1.6rem'} />
          </Button>
        </Box>
      </Box>

      <Box class={styles.groupStyle} aria-label={'Editor toolbar'}>
        <Box
          direction={'row'}
          aria-label={'Editor modes'}
        >
          <For each={tools}>
            {(tool) => (
              <Button
                variant={'ghost'}
                size={'md'}
                p={'sm'}
                type={'icon'}
                active={props.selectedTool === tool.id}
                title={tool.label}
                aria-label={tool.label}
                onClick={() => props.onSelectTool(tool.id)}
              >
                <Icon name={tool.icon} size={'1.6rem'} />
              </Button>
            )}
          </For>
        </Box>
      </Box>
    </Box>
  );
}
