import { Box, Button } from '@suis-ui/kit';
import { Save } from 'lucide-solid';
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';

import { Dialog } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import type { LevelData, RecognitionPayload } from '@/models/level';
import {
  buildRecognitionTilePreview,
  type RecognitionTilePreview as RecognitionTilePreviewData,
} from '@/stores/recognition';
import { RecognitionTilePreview } from '../recognition-tile-preview';
import { dialogContentStyle } from './recognition-result-dialog.css';
import {
  getPrimaryRecognitionPayload,
  shouldCloseAfterRecognitionInsert,
} from './recognition-result-dialog.utils';

type RecognitionResultDialogProps = {
  open: boolean;
  level: LevelData;
  payloads: RecognitionPayload[];
  onClose: () => void;
  onInsertPayload: (payload: RecognitionPayload) => Promise<string | null>;
};

export const RecognitionResultDialog = (
  props: RecognitionResultDialogProps,
) => {
  const [insertPending, setInsertPending] = createSignal(false);
  const [tilePreview, setTilePreview] =
    createSignal<RecognitionTilePreviewData | null>(null);
  const [previewPending, setPreviewPending] = createSignal(false);
  const [previewError, setPreviewError] = createSignal<string | null>(null);
  let previewRequestId = 0;

  const selectedPayload = createMemo(() =>
    getPrimaryRecognitionPayload(props.payloads),
  );
  const buildSelectedPreview = (payload: RecognitionPayload) => {
    previewRequestId += 1;
    const requestId = previewRequestId;

    setTilePreview(null);
    setPreviewPending(true);
    setPreviewError(null);

    void buildRecognitionTilePreview(props.level, payload, {
      tileSize: props.level.gridSize,
      viewportWidth:
        typeof window === 'undefined' ? undefined : window.innerWidth,
    })
      .then((preview) => {
        if (requestId === previewRequestId) {
          setTilePreview(preview);
        }
      })
      .catch((error) => {
        if (requestId === previewRequestId) {
          setPreviewError(
            error instanceof Error
              ? error.message
              : 'Preview 생성에 실패했습니다.',
          );
        }
      })
      .finally(() => {
        if (requestId === previewRequestId) {
          setPreviewPending(false);
        }
      });
  };
  const handleInsert = async () => {
    const payload = selectedPayload();

    if (!payload) {
      setPreviewError('인식 결과가 없습니다.');
      return;
    }

    setInsertPending(true);
    setPreviewError(null);

    try {
      const layerId = await props.onInsertPayload(payload);

      if (!shouldCloseAfterRecognitionInsert(layerId)) {
        setPreviewError('활성 레벨 스냅샷이 없습니다.');
        return;
      }

      props.onClose();
    } catch (error) {
      setPreviewError(
        error instanceof Error ? error.message : '레이어 삽입에 실패했습니다.',
      );
    } finally {
      setInsertPending(false);
    }
  };

  createEffect(() => {
    if (!props.open) {
      return;
    }

    setInsertPending(false);
  });

  createEffect(() => {
    const payload = selectedPayload();

    previewRequestId += 1;
    setTilePreview(null);
    setPreviewError(null);

    if (!props.open || !payload) {
      setPreviewPending(false);
      return;
    }

    buildSelectedPreview(payload);
  });

  onCleanup(() => {
    previewRequestId += 1;
  });

  return (
    <Dialog
      open={props.open}
      title={'인식 결과'}
      onClose={props.onClose}
      footer={
        <>
          <Button variant={'ghost'} onClick={props.onClose}>
            {'취소'}
          </Button>
          <Button
            variant={'primary'}
            disabled={!selectedPayload() || insertPending()}
            onClick={handleInsert}
          >
            <Icon name={Save} />
            {'Insert Layer'}
          </Button>
        </>
      }
    >
      <Box class={dialogContentStyle} maxW={'calc(100vw - 4rem)'}>
        <RecognitionTilePreview
          preview={tilePreview()}
          pending={previewPending()}
          error={previewError()}
        />
      </Box>
    </Dialog>
  );
};
