# React Zenith Editor

React Zenith Editor is a lightweight, TypeScript-first rich text editor foundation for React. The current scaffold includes:

- a structured document model in the core package
- a React editor wrapper for rendering and editing content
- a test suite covering the core document operations and editor rendering

## Packages

- @react-zenith-editor/core: typed JSON document model and serialization helpers
- react-zenith-editor: React editor wrapper

## Quick start

```tsx
import { Editor } from 'react-zenith-editor';

export function Demo() {
  return <Editor placeholder="Start writing..." />;
}
```

## Development

```bash
pnpm install
pnpm test
```
