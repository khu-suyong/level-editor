import { Box, Button } from "@suis-ui/kit";
import { For } from "solid-js";

import type { EditorTool } from "../../../stores/editor";
import * as styles from "./tool-panel.css";

const tools = [
  { id: "select", label: "Select", shortcut: "V" },
  { id: "brush", label: "Brush", shortcut: "B" },
  { id: "erase", label: "Erase", shortcut: "E" },
  { id: "pan", label: "Pan", shortcut: "H" },
] as const satisfies ReadonlyArray<{
  id: EditorTool;
  label: string;
  shortcut: string;
}>;

type ToolPanelProps = {
  selectedTool: EditorTool;
  onSelectTool: (selectedTool: EditorTool) => void;
};

export function ToolPanel(props: ToolPanelProps) {
  return (
    <Box
      as="aside"
      class={styles.panel}
      direction="column"
      gap="sm"
      bg="surface.high"
      bc="surface.higher"
      bw="thin"
      aria-label="Tools"
    >
      <Box as="h2" class={styles.panelTitle} text="caption" c="text.caption">
        Tools
      </Box>
      <Box class={styles.toolList}>
        <For each={tools}>
          {(tool) => (
            <Button
              class={styles.toolButton}
              variant="ghost"
              size="sm"
              active={props.selectedTool === tool.id}
              onClick={() => props.onSelectTool(tool.id)}
            >
              <Box as="span" flex="1">
                {tool.label}
              </Box>
              <Box as="kbd" class={styles.toolShortcut} c="text.caption">
                {tool.shortcut}
              </Box>
            </Button>
          )}
        </For>
      </Box>
    </Box>
  );
}
