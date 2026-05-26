import { Box, Button, Item } from '@suis-ui/kit';
import { X } from 'lucide-solid';
import {
  createEffect,
  createUniqueId,
  type JSX,
  onCleanup,
  Show,
} from 'solid-js';
import { Portal } from 'solid-js/web';

import { Icon } from '../icon';
import * as styles from './dialog.css';

type DialogProps = {
  open: boolean;
  title: JSX.Element;
  description?: JSX.Element;
  onClose: () => void;
  children: JSX.Element;
  footer?: JSX.Element;
  initialFocusRef?: () => HTMLElement | null | undefined;
  closeOnBackdrop?: boolean;
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const isFocusable = (element: HTMLElement) =>
  element.tabIndex >= 0 &&
  !element.hasAttribute('disabled') &&
  (element.offsetWidth > 0 ||
    element.offsetHeight > 0 ||
    element.getClientRects().length > 0);

export const Dialog = (props: DialogProps) => {
  let panelRef: HTMLDivElement | undefined;
  let restoreFocusElement: HTMLElement | null = null;
  const titleId = createUniqueId();
  const descriptionId = createUniqueId();
  const getFocusableElements = () =>
    Array.from(
      panelRef?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    ).filter(isFocusable);
  const focusInitialElement = () => {
    const target =
      props.initialFocusRef?.() ?? getFocusableElements()[0] ?? panelRef;

    target?.focus();
  };
  const restoreFocus = () => {
    restoreFocusElement?.focus();
    restoreFocusElement = null;
  };
  const handleBackdropMouseDown: JSX.EventHandler<
    HTMLDivElement,
    MouseEvent
  > = (event) => {
    if (props.closeOnBackdrop === false) {
      return;
    }

    if (event.target === event.currentTarget) {
      props.onClose();
    }
  };
  const handleKeyDown: JSX.EventHandler<HTMLDivElement, KeyboardEvent> = (
    event,
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      props.onClose();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements();

    if (focusableElements.length === 0) {
      event.preventDefault();
      panelRef?.focus();
      return;
    }

    const activeElement = document.activeElement;
    const activeIndex =
      activeElement instanceof HTMLElement
        ? focusableElements.indexOf(activeElement)
        : -1;
    const nextIndex = event.shiftKey
      ? activeIndex <= 0
        ? focusableElements.length - 1
        : activeIndex - 1
      : activeIndex === focusableElements.length - 1
        ? 0
        : activeIndex + 1;

    event.preventDefault();
    focusableElements[nextIndex]?.focus();
  };

  createEffect((wasOpen: boolean) => {
    if (!props.open) {
      if (wasOpen) {
        restoreFocus();
      }

      return false;
    }

    restoreFocusElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    queueMicrotask(focusInitialElement);

    return true;
  }, false);

  onCleanup(() => {
    if (props.open) {
      restoreFocus();
    }
  });

  return (
    <Show when={props.open}>
      <Portal>
        <Box
          class={styles.backdrop}
          role={'presentation'}
          onMouseDown={handleBackdropMouseDown}
        >
          <Box
            ref={panelRef}
            class={styles.panel}
            role={'dialog'}
            aria-modal={true}
            aria-labelledby={titleId}
            aria-describedby={props.description ? descriptionId : undefined}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
          >
            <Item
              size={'sm'}
              title={
                <Box id={titleId} text={'title'}>
                  {props.title}
                </Box>
              }
              description={
                props.description ? (
                  <Box id={descriptionId} text={'caption'} c={'text.caption'}>
                    {props.description}
                  </Box>
                ) : undefined
              }
              action={
                <Button
                  variant={'ghost'}
                  type={'icon'}
                  size={'sm'}
                  aria-label={'Close dialog'}
                  onClick={props.onClose}
                >
                  <Icon name={X} />
                </Button>
              }
            />
            <Box class={styles.body}>{props.children}</Box>
            <Show when={props.footer}>
              {(footer) => <Box class={styles.footer}>{footer()}</Box>}
            </Show>
          </Box>
        </Box>
      </Portal>
    </Show>
  );
};
