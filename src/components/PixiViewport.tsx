import { Application, Container, Graphics } from "pixi.js";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";

import { setCanvasReady } from "../stores/editor";
import * as styles from "../styles/app.css";

type PixiViewportProps = {
  zoom: number;
};

export function PixiViewport(props: PixiViewportProps) {
  let host!: HTMLDivElement;
  const [stageRoot, setStageRoot] = createSignal<Container | null>(null);

  onMount(() => {
    let disposed = false;
    const app = new Application();
    const grid = new Graphics();
    const world = new Container();

    const drawGrid = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;

      grid.clear();
      grid.rect(0, 0, width, height).fill({ color: 0x101827 });

      for (let x = 0; x <= width; x += 32) {
        grid.moveTo(x, 0).lineTo(x, height).stroke({ color: 0x263244, width: 1 });
      }

      for (let y = 0; y <= height; y += 32) {
        grid.moveTo(0, y).lineTo(width, y).stroke({ color: 0x263244, width: 1 });
      }

      grid.rect(32, 32, 96, 64).fill({ color: 0x1d4ed8, alpha: 0.64 });
      grid.rect(160, 96, 128, 32).fill({ color: 0x047857, alpha: 0.72 });
    };

    const resizeObserver = new ResizeObserver(() => {
      if (!app.renderer) {
        return;
      }

      app.renderer.resize(host.clientWidth, host.clientHeight);
      drawGrid();
    });

    void app
      .init({
        antialias: true,
        autoDensity: true,
        background: "#101827",
        height: host.clientHeight,
        resolution: window.devicePixelRatio || 1,
        width: host.clientWidth,
      })
      .then(() => {
        if (disposed) {
          app.destroy();
          return;
        }

        app.canvas.className = styles.pixiCanvas;
        host.appendChild(app.canvas);
        world.addChild(grid);
        app.stage.addChild(world);
        drawGrid();
        resizeObserver.observe(host);
        setStageRoot(world);
        setCanvasReady(true);
      });

    onCleanup(() => {
      disposed = true;
      resizeObserver.disconnect();
      setCanvasReady(false);
      app.destroy(true);
    });
  });

  createEffect(() => {
    const root = stageRoot();

    if (!root) {
      return;
    }

    const scale = props.zoom / 100;
    root.scale.set(scale);
  });

  return <div ref={host} class={styles.viewport} />;
}
