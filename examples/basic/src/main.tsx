import React from 'react';
import ReactDOM from 'react-dom/client';
import { Editor } from 'react-zenith-editor';

const demoValue = {
  blocks: [
    {
      id: 'demo-block-1',
      type: 'paragraph' as const,
      text: `A Creative Guide to Web Formatting\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. You can modify this content with the toolbar controls above.\n\nHere are a few examples:\n• Bold, italic, and underline text\n• Ordered and unordered lists\n• Alignment and heading styles\n• Links, image insertion, and code block formatting\n\nSample data\nHere is a sample paragraph ready for editing.`
    }
  ]
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ maxWidth: 980, margin: '18px auto', fontFamily: 'Segoe UI, Arial, sans-serif', background: '#ffffff', border: '1px solid #e5e7eb', padding: 8 }}>
      <Editor value={demoValue} placeholder="Start writing your next great document..." />
    </div>
  </React.StrictMode>
);
