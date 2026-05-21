# Using `@suis-ui/kit` in an application

This guide is for AI agents working in an application repository that consumes `@suis-ui/kit`. Treat the package as an external UI library for SolidJS applications.

## Scope

- Build application UI with `@suis-ui/kit`.
- Do not import from lower-level implementation packages.
- Do not edit or copy library internals into the application.
- Prefer kit components and theme APIs over local reimplementations.
- Preserve existing application code style and user changes.

## Default setup

Install the package in the consuming application:

```bash
npm install solid-js @suis-ui/kit
```

Import the bundled stylesheet once, usually in the app entry file:

```tsx
import { render } from 'solid-js/web';
import { ThemeProvider } from '@suis-ui/kit';
import { App } from './App';
import '@suis-ui/kit/style.css';

render(
  () => (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  ),
  document.getElementById('root')!,
);
```

`ThemeProvider` is the default root provider for application code. It applies base tokens, component tokens, and the light semantic theme to `document.body`.

## Preferred imports

```tsx
import {
  Box,
  Button,
  CheckBox,
  Item,
  Popup,
  Select,
  Input,
  Tooltip,
  createTheme,
  token,
  vars,
  component,
  useTheme,
} from '@suis-ui/kit';
```

## Styling guidance

- Use `Box` as the main layout and styling primitive.
- Prefer `Box` props over custom CSS for layout, spacing, colors, borders, radius, text, and sizing.
- Prefer semantic design-system values such as `surface.main`, `surface.higher`, `surface.contrast`, `text.main`, `text.caption`, `primary.main`, `primary.contrast`, `md`, `lg`, `body`, and `title`.
- Avoid raw CSS lengths such as `px`, `rem`, and `%` when a design-system value can express the same intent.
- Use values already defined in `token` or `vars` for theme customization instead of hard-coded measurements and colors.
- Use `class`, `classList`, and `style` only for additions that are not covered by kit props.
- Use `as` when a styled element should render as another HTML element.

Example:

```tsx
<Box
  as="section"
  p="lg"
  gap="md"
  r="lg"
  bg="surface.main"
  c="text.main"
  bc="surface.higher"
>
  <Box text="title">Settings</Box>
  <Button variant="primary">Save</Button>
</Box>
```

## Theme guidance

Use `createTheme` for theme customization. Keep these token groups distinct:

- `token`: base tokens such as raw color palettes, spacing, and size values.
- `vars`: semantic tokens such as surface, text, primary, secondary, font, shadow, and semantic size values.
- `component`: component-specific tokens for button, checkbox, popup, select, input, and tooltip styling.

Prefer overriding `vars` for application themes. Use `component` only when a specific component needs a themed visual treatment.
When overriding theme values, reference existing `token` and `vars` paths whenever possible. Hard-code raw CSS values only for genuinely new design decisions that are not represented by the design system.

```tsx
const darkTheme = createTheme({
  vars: {
    color: {
      surface: {
        main: token.color.gray[900],
        contrast: token.color.gray[50],
        high: token.color.gray[800],
        higher: token.color.gray[700],
      },
      text: {
        main: token.color.gray[50],
        caption: token.color.gray[400],
        disabled: token.color.gray[500],
      },
    },
  },
});
```

Switch themes through `useTheme()` inside `ThemeProvider`:

```tsx
const [theme, setTheme] = useTheme();

<Button
  variant="ghost"
  active={theme() === darkTheme}
  onClick={() => setTheme(theme() === darkTheme ? null : darkTheme)}
>
  Toggle theme
</Button>;
```

## Component guidance

- `Box`: use for layout, spacing, semantic colors, text styles, borders, fixed sizing, and polymorphic rendering.
- `Button`: use for actions. Variants are `default`, `primary`, `secondary`, and `ghost`; sizes are `xs`, `sm`, `md`, `lg`, and `xl`; use `type="icon"` for icon-only buttons. `type` is a kit layout prop, not the native HTML button type; pass native submit/reset type through the `props` escape hatch when needed.
- `CheckBox`: use for boolean state; use `checked` and `onChecked` for controlled state.
- `Item`: use for row-style content and menu rows. Pass content through `media`, `title`, `description`, and `action` slots; render interactive rows with `as="button"` or `as="a"` instead of local item wrappers.
- `Popup`: use for floating content; pass floating UI through `element` and the trigger as children.
- `Select`: use for single selection; support string data, `{ value, label }` data, and grouped `{ label, options }` data.
- `Input`: use for native input controls with kit styling.
- `Tooltip`: use for helper content; pass tooltip body through `content` and trigger as children.

Keep stateful examples idiomatic to SolidJS:

```tsx
const [value, setValue] = createSignal<string | null>(null);

<Select
  value={value()}
  onChangeValue={setValue}
  data={['Draft', 'Published', 'Archived']}
  placeholder="Status"
/>;
```
