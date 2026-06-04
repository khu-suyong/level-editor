import type { EditorTool } from '@/stores/editor';

export type ShortcutGroupId = 'file' | 'edit' | 'tool' | 'view' | 'help';

export type ShortcutActionId =
  | 'save-level'
  | 'open-level'
  | 'import-recognition'
  | 'undo'
  | 'redo'
  | 'copy'
  | 'paste'
  | 'delete-selection'
  | 'cancel'
  | 'select-tool'
  | 'brush-tool'
  | 'fill-tool'
  | 'erase-tool'
  | 'pan-tool'
  | 'temporary-pan'
  | 'pan-view'
  | 'fast-pan-view'
  | 'reset-view'
  | 'open-shortcut-help';

export type ShortcutBinding = {
  alt?: boolean;
  aria: string;
  code?: string;
  ctrlOrMeta?: boolean;
  display: string;
  key?: string;
  keys?: readonly string[];
  shift?: boolean;
};

export type ShortcutDefinition = {
  bindings: readonly ShortcutBinding[];
  group: ShortcutGroupId;
  id: ShortcutActionId;
  label: string;
};

export type ShortcutMatch = {
  binding: ShortcutBinding;
  shortcut: ShortcutDefinition;
};

const shortcuts = [
  {
    id: 'save-level',
    group: 'file',
    label: '레벨 저장',
    bindings: [
      {
        key: 's',
        ctrlOrMeta: true,
        display: 'Ctrl/Cmd+S',
        aria: 'Control+S Meta+S',
      },
    ],
  },
  {
    id: 'open-level',
    group: 'file',
    label: '레벨 불러오기',
    bindings: [
      {
        key: 'o',
        ctrlOrMeta: true,
        display: 'Ctrl/Cmd+O',
        aria: 'Control+O Meta+O',
      },
    ],
  },
  {
    id: 'import-recognition',
    group: 'file',
    label: '이미지 인식',
    bindings: [
      {
        key: 'i',
        ctrlOrMeta: true,
        display: 'Ctrl/Cmd+I',
        aria: 'Control+I Meta+I',
      },
    ],
  },
  {
    id: 'undo',
    group: 'edit',
    label: '실행 취소',
    bindings: [
      {
        key: 'z',
        ctrlOrMeta: true,
        display: 'Ctrl/Cmd+Z',
        aria: 'Control+Z Meta+Z',
      },
    ],
  },
  {
    id: 'redo',
    group: 'edit',
    label: '다시 실행',
    bindings: [
      {
        key: 'z',
        ctrlOrMeta: true,
        shift: true,
        display: 'Ctrl/Cmd+Shift+Z',
        aria: 'Control+Shift+Z Meta+Shift+Z',
      },
      {
        key: 'y',
        ctrlOrMeta: true,
        display: 'Ctrl/Cmd+Y',
        aria: 'Control+Y Meta+Y',
      },
    ],
  },
  {
    id: 'copy',
    group: 'edit',
    label: '선택 복사',
    bindings: [
      {
        key: 'c',
        ctrlOrMeta: true,
        display: 'Ctrl/Cmd+C',
        aria: 'Control+C Meta+C',
      },
    ],
  },
  {
    id: 'paste',
    group: 'edit',
    label: '붙여넣기',
    bindings: [
      {
        key: 'v',
        ctrlOrMeta: true,
        display: 'Ctrl/Cmd+V',
        aria: 'Control+V Meta+V',
      },
    ],
  },
  {
    id: 'delete-selection',
    group: 'edit',
    label: '선택 삭제',
    bindings: [
      {
        key: 'Delete',
        display: 'Delete',
        aria: 'Delete',
      },
      {
        key: 'Backspace',
        display: 'Backspace',
        aria: 'Backspace',
      },
    ],
  },
  {
    id: 'cancel',
    group: 'edit',
    label: '취소 / 선택 해제',
    bindings: [
      {
        key: 'Escape',
        display: 'Escape',
        aria: 'Escape',
      },
    ],
  },
  {
    id: 'select-tool',
    group: 'tool',
    label: '선택 도구',
    bindings: [
      {
        key: 'v',
        display: 'V',
        aria: 'V',
      },
      {
        key: '1',
        display: '1',
        aria: '1',
      },
    ],
  },
  {
    id: 'brush-tool',
    group: 'tool',
    label: '브러시 도구',
    bindings: [
      {
        key: 'b',
        display: 'B',
        aria: 'B',
      },
      {
        key: '2',
        display: '2',
        aria: '2',
      },
    ],
  },
  {
    id: 'fill-tool',
    group: 'tool',
    label: '채우기 도구',
    bindings: [
      {
        key: 'g',
        display: 'G',
        aria: 'G',
      },
      {
        key: '3',
        display: '3',
        aria: '3',
      },
    ],
  },
  {
    id: 'erase-tool',
    group: 'tool',
    label: '지우개 도구',
    bindings: [
      {
        key: 'e',
        display: 'E',
        aria: 'E',
      },
      {
        key: '4',
        display: '4',
        aria: '4',
      },
    ],
  },
  {
    id: 'pan-tool',
    group: 'tool',
    label: '팬 도구',
    bindings: [
      {
        key: 'h',
        display: 'H',
        aria: 'H',
      },
      {
        key: '5',
        display: '5',
        aria: '5',
      },
    ],
  },
  {
    id: 'temporary-pan',
    group: 'view',
    label: '임시 팬',
    bindings: [
      {
        code: 'Space',
        display: 'Space',
        aria: 'Space',
      },
    ],
  },
  {
    id: 'pan-view',
    group: 'view',
    label: '뷰 이동',
    bindings: [
      {
        keys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
        display: 'Arrow keys',
        aria: 'ArrowLeft ArrowRight ArrowUp ArrowDown',
      },
    ],
  },
  {
    id: 'fast-pan-view',
    group: 'view',
    label: '빠른 뷰 이동',
    bindings: [
      {
        keys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
        shift: true,
        display: 'Shift+Arrow keys',
        aria: 'Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown',
      },
    ],
  },
  {
    id: 'reset-view',
    group: 'view',
    label: '뷰 리셋',
    bindings: [
      {
        key: '0',
        display: '0',
        aria: '0',
      },
    ],
  },
  {
    id: 'open-shortcut-help',
    group: 'help',
    label: '단축키 도움말',
    bindings: [
      {
        key: '?',
        shift: true,
        display: '?',
        aria: '?',
      },
      {
        key: '/',
        ctrlOrMeta: true,
        display: 'Ctrl/Cmd+/',
        aria: 'Control+/ Meta+/',
      },
    ],
  },
] as const satisfies readonly ShortcutDefinition[];

export const shortcutDefinitions = shortcuts;

export const shortcutById = Object.fromEntries(
  shortcutDefinitions.map((shortcut) => [shortcut.id, shortcut]),
) as unknown as Record<ShortcutActionId, ShortcutDefinition>;

export const editorToolShortcutActionIds = {
  select: 'select-tool',
  brush: 'brush-tool',
  fill: 'fill-tool',
  erase: 'erase-tool',
  pan: 'pan-tool',
} as const satisfies Record<EditorTool, ShortcutActionId>;

export const shortcutHelpGroups = [
  {
    id: 'file',
    label: '파일',
    shortcuts: [
      shortcutById['save-level'],
      shortcutById['open-level'],
      shortcutById['import-recognition'],
    ],
  },
  {
    id: 'edit',
    label: '편집',
    shortcuts: [
      shortcutById.undo,
      shortcutById.redo,
      shortcutById.copy,
      shortcutById.paste,
      shortcutById['delete-selection'],
      shortcutById.cancel,
    ],
  },
  {
    id: 'tool',
    label: '도구',
    shortcuts: [
      shortcutById['select-tool'],
      shortcutById['brush-tool'],
      shortcutById['fill-tool'],
      shortcutById['erase-tool'],
      shortcutById['pan-tool'],
    ],
  },
  {
    id: 'view',
    label: '보기',
    shortcuts: [
      shortcutById['temporary-pan'],
      shortcutById['pan-view'],
      shortcutById['fast-pan-view'],
      shortcutById['reset-view'],
    ],
  },
  {
    id: 'help',
    label: '도움말',
    shortcuts: [shortcutById['open-shortcut-help']],
  },
] as const;

const normalizeKey = (key: string) =>
  key.length === 1 ? key.toLowerCase() : key;

const matchesModifier = (actual: boolean, expected?: boolean) =>
  expected === undefined ? !actual : actual === expected;

export const matchesShortcutBinding = (
  event: KeyboardEvent,
  binding: ShortcutBinding,
) => {
  if (binding.code && event.code !== binding.code) {
    return false;
  }

  if (binding.key && normalizeKey(event.key) !== normalizeKey(binding.key)) {
    return false;
  }

  if (
    binding.keys &&
    !binding.keys.some((key) => normalizeKey(event.key) === normalizeKey(key))
  ) {
    return false;
  }

  return (
    matchesModifier(event.altKey, binding.alt) &&
    matchesModifier(event.shiftKey, binding.shift) &&
    matchesModifier(event.ctrlKey || event.metaKey, binding.ctrlOrMeta)
  );
};

export const getShortcutBindingMatch = (
  event: KeyboardEvent,
  shortcut: ShortcutDefinition,
) =>
  shortcut.bindings.find((binding) => matchesShortcutBinding(event, binding)) ??
  null;

export const matchesShortcut = (
  event: KeyboardEvent,
  shortcut: ShortcutDefinition,
) => Boolean(getShortcutBindingMatch(event, shortcut));

export const getShortcutMatch = (
  event: KeyboardEvent,
  shortcut: ShortcutDefinition,
): ShortcutMatch | null => {
  const binding = getShortcutBindingMatch(event, shortcut);

  return binding ? { binding, shortcut } : null;
};

export const getShortcutDisplay = (shortcut: ShortcutDefinition) =>
  shortcut.bindings.map((binding) => binding.display).join(' / ');

export const getShortcutAriaKeys = (shortcut: ShortcutDefinition) =>
  shortcut.bindings.map((binding) => binding.aria).join(' ');

const textEditingInputTypes = new Set([
  'date',
  'datetime-local',
  'email',
  'month',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week',
]);

const interactiveShortcutTargetSelector = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[role="slider"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const isHTMLElement = (target: EventTarget | null): target is HTMLElement =>
  target instanceof HTMLElement;

const uniqueElements = (elements: HTMLElement[]) => {
  const elementSet = new Set<HTMLElement>();

  return elements.filter((element) => {
    if (elementSet.has(element)) {
      return false;
    }

    elementSet.add(element);
    return true;
  });
};

const getShortcutEventElements = (event: KeyboardEvent) => {
  const pathElements =
    typeof event.composedPath === 'function'
      ? event.composedPath().filter(isHTMLElement)
      : [];
  const targetElement = isHTMLElement(event.target) ? event.target : null;
  const activeElement =
    typeof document === 'undefined' || !isHTMLElement(document.activeElement)
      ? null
      : document.activeElement;

  return uniqueElements(
    [targetElement, activeElement, ...pathElements].filter(isHTMLElement),
  );
};

const isTextEditingInput = (element: HTMLElement) => {
  const input = element.closest('input');

  return input ? textEditingInputTypes.has(input.type) : false;
};

const isTextEditingShortcutElement = (element: HTMLElement) =>
  element.isContentEditable ||
  Boolean(
    element.closest(
      'textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]',
    ),
  ) ||
  isTextEditingInput(element);

const isInteractiveShortcutElement = (element: HTMLElement) =>
  Boolean(element.closest(interactiveShortcutTargetSelector));

const hasOpenModalDialog = () =>
  typeof document !== 'undefined' &&
  Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));

const isControlNavigationShortcutBinding = (binding: ShortcutBinding) =>
  binding.code === 'Space' ||
  binding.key === ' ' ||
  binding.key === 'Spacebar' ||
  binding.key?.startsWith('Arrow') ||
  binding.keys?.some((key) => key.startsWith('Arrow'));

export const isCommandShortcutBinding = (binding: ShortcutBinding) =>
  binding.ctrlOrMeta === true;

export const shouldIgnoreShortcutEvent = (
  event: KeyboardEvent,
  match: ShortcutMatch,
) => {
  const elements = getShortcutEventElements(event);

  if (
    hasOpenModalDialog() ||
    elements.some((element) => isTextEditingShortcutElement(element))
  ) {
    return true;
  }

  return (
    isControlNavigationShortcutBinding(match.binding) &&
    elements.some((element) => isInteractiveShortcutElement(element))
  );
};
