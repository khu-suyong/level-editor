import {
  Box,
  Button,
  type ButtonProps,
  Item,
  Popup,
  type PopupProps,
} from '@suis-ui/kit';
import { createSignal, For, splitProps, type ValidComponent } from 'solid-js';
import { Icon, type IconType } from '../icon';

type MenuItem = {
  ariaKeyShortcuts?: string;
  label: string;
  disabled?: boolean;
  icon?: IconType;
  onClick: () => void;
  shortcut?: string;
};
type PopupOnlyProps = {
  animation?: Record<string, string>;
  placement?: PopupProps<ValidComponent>['placement'];
  strategy?: PopupProps<ValidComponent>['strategy'];
  offset?: PopupProps<ValidComponent>['offset'];
  shift?: PopupProps<ValidComponent>['shift'];
  flip?: PopupProps<ValidComponent>['flip'];
  autoUpdate?: PopupProps<ValidComponent>['autoUpdate'];
  middleware?: PopupProps<ValidComponent>['middleware'];
};
type MenuButtonOnlyProps = {
  items: MenuItem[];
};
export type MenuButtonProps<T extends ValidComponent = 'button'> = Omit<
  ButtonProps<T>,
  keyof MenuButtonOnlyProps | keyof PopupOnlyProps
> &
  MenuButtonOnlyProps &
  PopupOnlyProps;
export const MenuButton = <T extends ValidComponent = 'button'>(
  props: MenuButtonProps<T>,
) => {
  const [local, popupProps, rest] = splitProps(
    props,
    ['items'],
    [
      'animation',
      'placement',
      'strategy',
      'offset',
      'shift',
      'flip',
      'autoUpdate',
      'middleware',
    ],
  );

  const [open, setOpen] = createSignal(false);

  const handleClick = (event: MouseEvent) => {
    setOpen(!open());
    return rest.onClick?.(event);
  };
  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) {
      return;
    }

    item.onClick();
    setOpen(false);
  };

  return (
    <Popup
      {...popupProps}
      open={open()}
      element={
        <Box
          as={'ul'}
          minW={'20rem'}
          aria-label={'Menu'}
          direction={'column'}
          gap={'xs'}
          p={'xs'}
          r={'lg'}
          bg={'surface.main'}
          bc={'surface.higher'}
          bd={'md'}
          shadow={'md'}
        >
          <For each={local.items}>
            {(item) => (
              <Item
                as={Button}
                variant={'ghost'}
                aria-disabled={item.disabled}
                aria-keyshortcuts={item.ariaKeyShortcuts}
                c={item.disabled ? 'text.disabled' : undefined}
                title={item.label}
                media={item.icon ? <Icon name={item.icon} /> : undefined}
                action={
                  item.shortcut ? (
                    <Box as={'span'} text={'caption'} c={'text.caption'}>
                      {item.shortcut}
                    </Box>
                  ) : undefined
                }
                onClick={() => handleItemClick(item)}
                style={{
                  'pointer-events': item.disabled ? 'none' : 'auto',
                }}
              />
            )}
          </For>
        </Box>
      }
    >
      <Button {...(rest as unknown as ButtonProps<T>)} onClick={handleClick} />
    </Popup>
  );
};
