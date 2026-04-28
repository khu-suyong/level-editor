import { atom, type WritableAtom } from "nanostores";
import { createSignal, onCleanup } from "solid-js";

export type EditorTool = "select" | "brush" | "erase" | "pan";

export type EditorState = {
  canvasReady: boolean;
  levelName: string;
  selectedTool: EditorTool;
  zoom: number;
};

const initialState: EditorState = {
  canvasReady: false,
  levelName: "Untitled Level",
  selectedTool: "select",
  zoom: 100,
};

export const editorStore = atom<EditorState>(initialState);

export function useStore<T>(store: WritableAtom<T>) {
  const [value, setValue] = createSignal(store.get());
  const unsubscribe = store.subscribe((nextValue) => setValue(() => nextValue));

  onCleanup(unsubscribe);

  return value;
}

export function setSelectedTool(selectedTool: EditorTool) {
  editorStore.set({
    ...editorStore.get(),
    selectedTool,
  });
}

export function setZoom(zoom: number) {
  editorStore.set({
    ...editorStore.get(),
    zoom,
  });
}

export function setCanvasReady(canvasReady: boolean) {
  editorStore.set({
    ...editorStore.get(),
    canvasReady,
  });
}
