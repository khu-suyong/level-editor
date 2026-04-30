import { Box } from "@suis-ui/kit";

import type { EditorTool } from "../../../stores/editor";
import * as styles from "./property-panel.css";

type PropertyPanelProps = {
  canvasReady: boolean;
  selectedTool: EditorTool;
  zoom: number;
  onZoomChange: (zoom: number) => void;
};

export function PropertyPanel(props: PropertyPanelProps) {
  return (
    <Box
      as="aside"
      class={styles.panel}
      direction="column"
      gap="md"
      bg="surface.high"
      bc="surface.higher"
      bw="thin"
      aria-label="Properties"
    >
      <div class={styles.panelHeader}>
        <Box as="h2" class={styles.panelTitle} text="caption" c="text.caption">
          Properties
        </Box>
        <Box text="caption" c="text.caption">
          {props.canvasReady ? "Ready" : "Loading"}
        </Box>
      </div>

      <Box as="dl" class={styles.propertyList}>
        <Box class={styles.propertyRow} bg="surface.higher" r="sm">
          <Box as="dt" class={styles.propertyTerm} text="caption" c="text.caption">
            Tool
          </Box>
          <Box as="dd" class={styles.propertyDetail} text="caption" c="text.main">
            {props.selectedTool}
          </Box>
        </Box>
        <Box class={styles.propertyRow} bg="surface.higher" r="sm">
          <Box as="dt" class={styles.propertyTerm} text="caption" c="text.caption">
            Grid
          </Box>
          <Box as="dd" class={styles.propertyDetail} text="caption" c="text.main">
            32 px
          </Box>
        </Box>
        <Box class={styles.propertyRow} bg="surface.higher" r="sm">
          <Box as="dt" class={styles.propertyTerm} text="caption" c="text.caption">
            Renderer
          </Box>
          <Box as="dd" class={styles.propertyDetail} text="caption" c="text.main">
            {props.canvasReady ? "Ready" : "Preparing"}
          </Box>
        </Box>
      </Box>

      <Box as="label" class={styles.zoomControl} c="text.caption">
        <Box as="span" text="caption">
          Zoom
        </Box>
        <input
          class={styles.zoomRange}
          type="range"
          min="25"
          max="200"
          step="5"
          value={props.zoom}
          onInput={(event) => props.onZoomChange(event.currentTarget.valueAsNumber)}
        />
        <Box as="output" class={styles.zoomOutput} text="caption" c="text.main">
          {props.zoom}%
        </Box>
      </Box>
    </Box>
  );
}
