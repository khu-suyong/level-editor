import { Box } from "@suis-ui/kit";

import { PixiViewport } from "../components/pixi-viewport";
import { editorStore, setSelectedTool, setZoom, useStore } from "../stores/editor";
import { PropertyPanel } from "./_components/property-panel";
import { SidePanel } from "./_components/side-panel";
import { ToolPanel } from "./_components/tool-panel";
import * as styles from "./index.css";

export default function HomePage() {
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

      <SidePanel levelName={editor().levelName} />
      <ToolPanel selectedTool={editor().selectedTool} onSelectTool={setSelectedTool} />
      <PropertyPanel
        canvasReady={editor().canvasReady}
        selectedTool={editor().selectedTool}
        zoom={editor().zoom}
        onZoomChange={setZoom}
      />
    </Box>
  );
}
