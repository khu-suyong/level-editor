import { Box, Button } from '@suis-ui/kit';
import { For } from 'solid-js';

import { Dialog } from '@/components/ui/dialog';
import { shortcutHelpGroups } from '@/helpers/editor-shortcuts';
import * as styles from './shortcut-help-dialog.css';

type ShortcutHelpDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const ShortcutHelpDialog = (props: ShortcutHelpDialogProps) => (
  <Dialog
    open={props.open}
    title={'키보드 단축키'}
    description={'에디터에서 사용할 수 있는 키보드 명령입니다.'}
    onClose={props.onClose}
    footer={
      <Button variant={'primary'} onClick={props.onClose}>
        {'닫기'}
      </Button>
    }
  >
    <Box class={styles.content} direction={'column'} gap={'lg'}>
      <For each={shortcutHelpGroups}>
        {(group) => (
          <Box direction={'column'} gap={'sm'}>
            <Box as={'h3'} text={'body'} c={'text.caption'}>
              {group.label}
            </Box>
            <Box direction={'column'} gap={'xs'}>
              <For each={group.shortcuts}>
                {(shortcut) => (
                  <Box class={styles.shortcutRow}>
                    <Box minW={'0'} text={'body'}>
                      {shortcut.label}
                    </Box>
                    <Box class={styles.keyList} aria-label={shortcut.label}>
                      <For each={shortcut.bindings}>
                        {(binding) => (
                          <Box as={'kbd'} class={styles.keyToken}>
                            {binding.display}
                          </Box>
                        )}
                      </For>
                    </Box>
                  </Box>
                )}
              </For>
            </Box>
          </Box>
        )}
      </For>
    </Box>
  </Dialog>
);
