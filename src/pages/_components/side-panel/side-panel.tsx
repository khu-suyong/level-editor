import { Box, Button } from '@suis-ui/kit';

import * as styles from './side-panel.css';

type SidePanelProps = {
  levelName: string;
};

export function SidePanel(props: SidePanelProps) {
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
            {props.levelName}
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
    </Box>
  );
}
