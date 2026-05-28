import { Box, type BoxProps } from '@suis-ui/kit';
import { splitProps } from 'solid-js';

export type SliderProps = Omit<
  BoxProps<'div'>,
  'as' | 'onChange' | 'onInput'
> & {
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
  step?: number;
  value: number;
};

export const Slider = (props: SliderProps) => {
  const [local, rest] = splitProps(props, [
    'aria-label',
    'class',
    'classList',
    'max',
    'min',
    'onChange',
    'onCommit',
    'step',
    'value',
    'w',
  ]);

  return (
    <Box
      {...rest}
      w={local.w ?? '100%'}
      class={local.class}
      classList={local.classList}
    >
      <input
        type={'range'}
        aria-label={local['aria-label']}
        min={`${local.min ?? 0}`}
        max={`${local.max ?? 100}`}
        step={`${local.step ?? 1}`}
        value={local.value}
        onInput={(event) => local.onChange(event.currentTarget.valueAsNumber)}
        onChange={(event) =>
          local.onCommit?.(event.currentTarget.valueAsNumber)
        }
        onBlur={(event) => local.onCommit?.(event.currentTarget.valueAsNumber)}
      />
    </Box>
  );
};
