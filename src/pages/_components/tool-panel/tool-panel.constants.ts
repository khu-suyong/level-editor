import {
  Eraser,
  Hand,
  MousePointer2,
  PaintBucket,
  Paintbrush,
} from 'lucide-solid';

import type { IconType } from '@/components/ui/icon';
import type { EditorTool } from '@/stores/editor';

export const tools = [
  { id: 'select', label: '선택', icon: MousePointer2 },
  { id: 'brush', label: '브러시', icon: Paintbrush },
  { id: 'fill', label: '채우기', icon: PaintBucket },
  { id: 'erase', label: '지우개', icon: Eraser },
  { id: 'pan', label: '팬', icon: Hand },
] as const satisfies ReadonlyArray<{
  id: EditorTool;
  label: string;
  icon: IconType;
}>;
