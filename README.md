# React Zenith Editor

React Zenith Editor is a lightweight, TypeScript-first rich text editor for React with two layers:

- a low-level editor component for full control
- a production-ready form field component for add and edit workflows

It is built to integrate cleanly with custom forms, React Hook Form, and Formik while keeping performance and developer experience strong.

## Packages

- `@react-zenith-editor/core`
  - typed document model
  - document utilities and serializers
- `react-zenith-editor`
  - `Editor` for low-level rich editing
  - `RichTextField` for high-level form integration

## Key Features

- Add mode and edit mode support
- Controlled and uncontrolled usage
- Rich toolbar: formatting, lists, links, media, tables, code blocks, print
- Drag and resize support for rich elements such as tables and media
- Hidden input support through `name` for native form submissions
- Ref handles for imperative focus, read, write, clear, and validate actions
- Built-in required/custom validation via `RichTextField`
- Lightweight runtime dependency surface

## Installation

This repository is a pnpm monorepo.

```bash
pnpm install
```

In project code:

```tsx
import { Editor, RichTextField } from 'react-zenith-editor';
```

## Quick Start

### Minimal Editor

```tsx
import { Editor } from 'react-zenith-editor';

export function BasicDemo() {
  return <Editor placeholder="Start writing..." />;
}
```

### Form-Ready Field

```tsx
import { RichTextField } from 'react-zenith-editor';
import { useState } from 'react';

export function BasicFormField() {
  const [body, setBody] = useState('');

  return (
    <RichTextField
      name="body"
      label="Body"
      required
      value={body}
      onChange={setBody}
      placeholder="Write your content..."
    />
  );
}
```

## Complete Use Cases

### 1) Add Mode

Use empty or default values for creating new content.

```tsx
import { RichTextField, type RichTextFieldHandle } from 'react-zenith-editor';
import { useRef, useState } from 'react';

export function CreatePostForm() {
  const fieldRef = useRef<RichTextFieldHandle>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | undefined>();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = fieldRef.current?.validate();
    setError(validationError);
    if (validationError) {
      fieldRef.current?.focus();
      return;
    }

    console.log({ title, content });
  };

  return (
    <form onSubmit={onSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />

      <RichTextField
        ref={fieldRef}
        name="content"
        label="Content"
        required
        value={content}
        onChange={setContent}
        error={error}
        placeholder="Write the post..."
      />

      <button type="submit">Create</button>
    </form>
  );
}
```

### 2) Edit Mode

Pre-populate existing content and let users edit safely.

```tsx
import { RichTextField } from 'react-zenith-editor';
import { useEffect, useState } from 'react';

type Post = {
  id: string;
  title: string;
  bodyHtml: string;
};

export function EditPostForm({ post }: { post: Post }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    setTitle(post.title);
    setContent(post.bodyHtml);
  }, [post]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        console.log({ id: post.id, title, content });
      }}
    >
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <RichTextField
        name="content"
        label="Content"
        value={content}
        onChange={setContent}
      />
      <button type="submit">Save</button>
    </form>
  );
}
```

### 3) Low-Level Editor Controlled by HTML

Use `Editor` directly if you want complete control.

```tsx
import { Editor } from 'react-zenith-editor';
import { useState } from 'react';

export function ControlledEditor() {
  const [html, setHtml] = useState('<p>Initial content</p>');

  return (
    <Editor
      name="content"
      html={html}
      onHtmlChange={setHtml}
      placeholder="Write..."
    />
  );
}
```

## Form Integration

### React Hook Form

```tsx
import { Controller, useForm } from 'react-hook-form';
import { RichTextField } from 'react-zenith-editor';

type FormValues = {
  title: string;
  body: string;
};

export function RhfExample() {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      title: '',
      body: '<p>Default body</p>'
    }
  });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <Controller
        name="body"
        control={control}
        rules={{
          validate: (value) => value.replace(/<[^>]*>/g, '').trim().length > 0 || 'Body is required'
        }}
        render={({ field, fieldState }) => (
          <RichTextField
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            label="Body"
          />
        )}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Formik

```tsx
import { Formik, Form } from 'formik';
import { RichTextField } from 'react-zenith-editor';

export function FormikExample() {
  return (
    <Formik
      initialValues={{ body: '' }}
      validate={(values) => {
        const text = values.body.replace(/<[^>]*>/g, '').trim();
        return text ? {} : { body: 'Body is required' };
      }}
      onSubmit={(values) => {
        console.log(values);
      }}
    >
      {({ values, errors, touched, setFieldValue, setFieldTouched }) => (
        <Form>
          <RichTextField
            name="body"
            label="Body"
            value={values.body}
            onChange={(html) => setFieldValue('body', html)}
            onBlur={() => setFieldTouched('body', true)}
            error={touched.body ? (errors.body as string | undefined) : undefined}
          />
          <button type="submit">Submit</button>
        </Form>
      )}
    </Formik>
  );
}
```

### Native Form Submission

Because `Editor` and `RichTextField` support `name`, they render a hidden input with the current HTML value.

```tsx
<form method="post" action="/submit">
  <RichTextField name="body" label="Body" defaultValue="<p>Hello</p>" />
  <button type="submit">Submit</button>
</form>
```

## API Reference

### Editor

Props in `Editor`:

- Data and change
  - `value?: DocumentModel`
  - `onChange?: (value: DocumentModel) => void`
  - `html?: string`
  - `defaultValue?: string`
  - `onHtmlChange?: (html: string) => void`
- Form compatibility
  - `name?: string`
  - `onBlur?: React.FocusEventHandler<HTMLDivElement>`
  - `disabled?: boolean`
  - `readOnly?: boolean`
- UX
  - `placeholder?: string`
- Toolbar config
  - `toolbar?: ToolbarItem[]`
  - `toolbarPosition?: 'top' | 'bottom' | 'left' | 'right' | 'floating' | 'inline'`
  - `toolbarSticky?: boolean`
  - `toolbarWrap?: boolean`
  - `toolbarRounded?: boolean`
  - `toolbarShadow?: boolean`
  - `toolbarSize?: 'small' | 'medium' | 'large' | 'compact' | 'touch'`
  - `toolbarVariant?: 'default' | 'filled' | 'outlined'`
  - `toolbarTheme?: 'light' | 'dark' | 'minimal' | 'glass' | 'material' | 'bootstrap' | 'tailwind' | 'corporate'`
  - `toolbarDisabledSections?: ToolbarSection[]`
  - `toolbarFeatures?: ToolbarFeatureDefinition[]`
  - `plugins?: EditorPlugin[]`
  - `showTooltips?: boolean`
  - `showDividers?: boolean`
  - `iconSize?: number`
  - `buttonSize?: number`
  - `toolbarGap?: number`
- Media upload and validation
  - `maxImageSizeMB?: number`
  - `maxVideoSizeMB?: number`
  - `allowedImageTypes?: string[]`
  - `allowedVideoTypes?: string[]`
  - `onImageUpload?: (file: File) => Promise<string>`
  - `onVideoUpload?: (file: File) => Promise<string>`

Ref handle in `EditorHandle`:

- `getHTML(): string`
- `setHTML(html: string): void`
- `getText(): string`
- `focus(): void`
- `clear(): void`
- `isEmpty(): boolean`
- `element: HTMLDivElement | null`

### RichTextField

Props in `RichTextField`:

- Value and events
  - `value?: string`
  - `defaultValue?: string`
  - `onChange?: (html: string) => void`
  - `onBlur?: React.FocusEventHandler<HTMLDivElement>`
- Form behavior
  - `name?: string`
  - `required?: boolean`
  - `requiredMessage?: string`
  - `validate?: (html: string) => string | undefined`
  - `error?: string`
- Presentation
  - `label?: React.ReactNode`
  - `placeholder?: string`
  - `helperText?: React.ReactNode`
  - `disabled?: boolean`
  - `readOnly?: boolean`
  - `id?: string`
  - `className?: string`
  - `style?: React.CSSProperties`
  - `labelStyle?: React.CSSProperties`
  - `errorStyle?: React.CSSProperties`
- Pass-through editor config
  - `editorProps?: Omit<EditorProps, 'value' | 'onChange' | 'html' | 'defaultValue' | 'onHtmlChange' | 'onBlur' | 'name' | 'disabled' | 'readOnly' | 'placeholder'>`

Ref handle in `RichTextFieldHandle`:

- `focus(): void`
- `clear(): void`
- `getHTML(): string`
- `setHTML(html: string): void`
- `isEmpty(): boolean`
- `validate(): string | undefined`

## Toolbar Customization

### Restrict toolbar items

```tsx
import { Editor } from 'react-zenith-editor';

const toolbar = ['bold', 'italic', 'underline', 'link', 'orderedList', 'bulletList'] as const;

export function LimitedToolbar() {
  return <Editor toolbar={[...toolbar]} />;
}
```

### Add custom toolbar button

```tsx
import { Editor, type ToolbarItem } from 'react-zenith-editor';

const customToolbar: ToolbarItem[] = [
  'bold',
  'italic',
  {
    id: 'insertDate',
    tooltip: 'Insert date',
    icon: <span style={{ fontSize: 12 }}>DATE</span>,
    onClick: ({ runCommand }) => {
      runCommand('insertHTML', `<span>${new Date().toISOString().slice(0, 10)}</span>`);
    }
  }
];

export function CustomToolbar() {
  return <Editor toolbar={customToolbar} />;
}
```

## Upload Integration

```tsx
import { Editor } from 'react-zenith-editor';

async function uploadAsset(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch('/api/upload', { method: 'POST', body });
  const data = await response.json();
  return data.url;
}

export function UploadReadyEditor() {
  return (
    <Editor
      onImageUpload={uploadAsset}
      onVideoUpload={uploadAsset}
      maxImageSizeMB={10}
      maxVideoSizeMB={100}
    />
  );
}
```

## Core Document Model

```tsx
import { createDocument, insertParagraph, toggleMark, toHTML, toMarkdown } from '@react-zenith-editor/core';

const doc = createDocument('Hello');
const doc2 = insertParagraph(doc, doc.blocks[0].id);
const doc3 = toggleMark(doc2, doc2.blocks[0].id, 'bold');

console.log(toHTML(doc3));
console.log(toMarkdown(doc3));
```

## Performance Guidance

- Prefer controlled mode only when the parent truly needs immediate HTML state on every change.
- Use uncontrolled mode (`defaultValue`) for simple forms to reduce parent re-renders.
- Memoize heavy parent components around the editor.
- Avoid duplicating the same editor value in multiple local states.
- Use `RichTextField` for built-in validation and lower integration boilerplate.

## Accessibility Notes

- The editor surface exposes `role="textbox"` and `aria-multiline`.
- `RichTextField` provides label and error semantics suitable for form usage.
- Keep labels meaningful and pass explicit `id` when integrating into complex layouts.

## Troubleshooting

- Font family or size not applying
  - Ensure the text is selected before choosing a style.
  - In custom integrations, avoid manually stealing focus between selection and style actions.
- Empty content validation mismatch
  - Validate text after stripping tags if your backend requires plain text.
- Native form submit does not include editor value
  - Ensure `name` is provided on `Editor` or `RichTextField`.

## Development

```bash
pnpm install
pnpm test
```
