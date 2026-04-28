import { Box, Button } from "@suis-ui/kit";
import { For } from "solid-js";

import { PixiViewport } from "./components/PixiViewport";
import { editorStore, setSelectedTool, setZoom, useStore } from "./stores/editor";
import * as styles from "./styles/app.css";

const tools = [
  { id: "select", label: "Select", shortcut: "V" },
  { id: "brush", label: "Brush", shortcut: "B" },
  { id: "erase", label: "Erase", shortcut: "E" },
  { id: "pan", label: "Pan", shortcut: "H" },
] as const;

export function App() {
  const editor = useStore(editorStore);

  return (
    <Box as="main" class={styles.shell} bg="surface.main" c="text.main">
      <Box
        as="section"
        class={styles.canvasLayer}
        bg="gray.950"
        aria-label="Level canvas"
      >
        <PixiViewport zoom={editor().zoom} />
      </Box>

      <Box
        as="header"
        class={styles.floatingHeader}
        direction="column"
        gap="md"
        bg="surface.high"
        bc="surface.higher"
        bw="thin"
      >
        <div class={styles.brandRow}>
          <Box class={styles.appMark} bg="primary.main" c="primary.contrast">
            LE
          </Box>
          <Box minW="0">
            <Box as="h1" class={styles.title} text="body" c="text.main">
              {editor().levelName}
            </Box>
            <Box as="p" class={styles.subtitle} text="caption" c="text.caption">
              2D level editor
            </Box>
          </Box>
        </div>

        <div class={styles.actionRow} aria-label="Editor actions">
          <Button variant="default" size="sm">
            New
          </Button>
          <Button variant="default" size="sm">
            Save
          </Button>
          <Button variant="primary" size="sm">
            Playtest
          </Button>
        </div>
      </Box>

      <Box
        as="aside"
        class={styles.floatingTools}
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
                active={editor().selectedTool === tool.id}
                onClick={() => setSelectedTool(tool.id)}
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

      <Box
        as="aside"
        class={styles.floatingProperties}
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
            {editor().canvasReady ? "Ready" : "Loading"}
          </Box>
        </div>

        <Box as="dl" class={styles.propertyList}>
          <Box class={styles.propertyRow} bg="surface.higher" r="sm">
            <Box as="dt" class={styles.propertyTerm} text="caption" c="text.caption">
              Tool
            </Box>
            <Box as="dd" class={styles.propertyDetail} text="caption" c="text.main">
              {editor().selectedTool}
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
              {editor().canvasReady ? "Ready" : "Preparing"}
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
            value={editor().zoom}
            onInput={(event) => setZoom(event.currentTarget.valueAsNumber)}
          />
          <Box as="output" class={styles.zoomOutput} text="caption" c="text.main">
            {editor().zoom}%
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
