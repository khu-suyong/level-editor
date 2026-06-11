import { Box, Button, Input, Item, vars } from '@suis-ui/kit';
import { createEffect, createSignal, type JSX, Show } from 'solid-js';

import { Dialog } from '@/components/ui/dialog';
import type { LevelLayer } from '@/models/level';
import * as styles from './layer-rename-dialog.css';

type LayerRenameDialogProps = {
  layer: LevelLayer | undefined;
  onClose: () => void;
  onSave: (layerId: string, name: string) => string | null;
};

export const LayerRenameDialog = (props: LayerRenameDialogProps) => {
  let inputElement: HTMLInputElement | undefined;
  const [draftName, setDraftName] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const focusInput = () => {
    queueMicrotask(() => {
      inputElement?.focus();
      inputElement?.select();
    });
  };
  const handleClose = () => {
    setError(null);
    props.onClose();
  };
  const handleSave = () => {
    const layer = props.layer;

    if (!layer) {
      return;
    }

    const nextName = draftName().trim();
    const nextError = props.onSave(layer.id, nextName);

    if (nextError) {
      setError(nextError);
      focusInput();
      return;
    }

    setDraftName(nextName);
    setError(null);
    props.onClose();
  };
  const handleKeyDown: JSX.EventHandler<HTMLInputElement, KeyboardEvent> = (
    event,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSave();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
    }
  };

  createEffect(() => {
    const layer = props.layer;

    if (!layer) {
      return;
    }

    setDraftName(layer.name);
    setError(null);
    focusInput();
  });

  return (
    <Show when={props.layer}>
      {(layer) => (
        <Dialog
          open={true}
          title={'레이어 이름 변경'}
          onClose={handleClose}
          initialFocusRef={() => inputElement}
          footer={
            <>
              <Button variant={'ghost'} onClick={handleClose}>
                {'취소'}
              </Button>
              <Button variant={'primary'} onClick={handleSave}>
                {'이름 변경'}
              </Button>
            </>
          }
        >
          <Item
            size={'sm'}
            title={layer().name}
            description={`${layer().id} / order ${layer().order}`}
          />
          <Box class={styles.field}>
            <Box as={'label'} text={'caption'} c={'text.caption'}>
              {'새 이름'}
            </Box>
            <Input
              ref={(element) => {
                inputElement = element;
              }}
              w={'100%'}
              value={draftName()}
              aria-label={'레이어 이름'}
              onInput={(event) => {
                setDraftName(event.currentTarget.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
            />
          </Box>
          <Box
            minH={vars.font.caption.lineHeight}
            text={'caption'}
            c={'error.main'}
          >
            {error() ?? ' '}
          </Box>
        </Dialog>
      )}
    </Show>
  );
};
