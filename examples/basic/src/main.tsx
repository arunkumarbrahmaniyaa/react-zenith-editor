import React from 'react';
import ReactDOM from 'react-dom/client';
import { Editor, RichTextField, type RichTextFieldHandle } from 'react-zenith-editor';

const demoValue = {
  blocks: [
    {
      id: 'demo-block-1',
      type: 'paragraph' as const,
      text: `A Creative Guide to Web Formatting\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. You can modify this content with the toolbar controls above.\n\nHere are a few examples:\n• Bold, italic, and underline text\n• Ordered and unordered lists\n• Alignment and heading styles\n• Links, image insertion, and code block formatting\n\nSample data\nHere is a sample paragraph ready for editing.`
    }
  ]
};

// Simulated existing record used to demonstrate "edit mode".
const EXISTING_RECORD = {
  title: 'Release notes',
  body: '<p>These are the <strong>existing</strong> release notes loaded for editing. Update anything and submit.</p>'
};

function FormDemo() {
  const [mode, setMode] = React.useState<'add' | 'edit'>('add');
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [submitted, setSubmitted] = React.useState<{ title: string; body: string } | null>(null);
  const [bodyError, setBodyError] = React.useState<string>();
  const fieldRef = React.useRef<RichTextFieldHandle>(null);

  // Populate fields when entering edit mode; reset when adding.
  React.useEffect(() => {
    if (mode === 'edit') {
      setTitle(EXISTING_RECORD.title);
      setBody(EXISTING_RECORD.body);
    } else {
      setTitle('');
      setBody('');
    }
    setSubmitted(null);
    setBodyError(undefined);
  }, [mode]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const error = fieldRef.current?.validate();
    setBodyError(error);
    if (error) {
      fieldRef.current?.focus();
      return;
    }
    setSubmitted({ title, body });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32, borderTop: '1px solid #e5e7eb', paddingTop: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#111827' }}>
          {mode === 'add' ? 'Create record' : 'Edit record'} (form integration)
        </h2>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setMode('add')}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: mode === 'add' ? '#111827' : '#fff', color: mode === 'add' ? '#fff' : '#374151', cursor: 'pointer' }}
          >
            Add mode
          </button>
          <button
            type="button"
            onClick={() => setMode('edit')}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: mode === 'edit' ? '#111827' : '#fff', color: mode === 'edit' ? '#fff' : '#374151', cursor: 'pointer' }}
          >
            Edit mode
          </button>
        </div>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>
        Title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a title"
          style={{ height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
        />
      </label>

      <RichTextField
        ref={fieldRef}
        name="body"
        label="Body"
        required
        value={body}
        onChange={setBody}
        error={bodyError}
        placeholder="Write the record body..."
        helperText="Rich content is captured as HTML and stays in sync with the form state."
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          {mode === 'add' ? 'Create' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => fieldRef.current?.clear()}
          style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer' }}
        >
          Clear body
        </button>
      </div>

      {submitted ? (
        <pre style={{ margin: 0, padding: 12, background: '#f3f4f6', borderRadius: 8, fontSize: 12, overflow: 'auto' }}>
          {JSON.stringify(submitted, null, 2)}
        </pre>
      ) : null}
    </form>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ maxWidth: 980, margin: '18px auto', fontFamily: 'Segoe UI, Arial, sans-serif', background: '#ffffff', border: '1px solid #e5e7eb', padding: 16 }}>
      <Editor value={demoValue} placeholder="Start writing your next great document..." />
      <FormDemo />
    </div>
  </React.StrictMode>
);
