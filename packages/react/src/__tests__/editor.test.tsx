import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DocumentModel } from '@react-zenith-editor/core';
import { Editor } from '../index';

describe('Editor', () => {
  it('does not render placeholder when document has content', () => {
    render(<Editor placeholder="Start writing..." />);
    expect(screen.queryByText('Start writing...')).not.toBeInTheDocument();
  });

  it('renders placeholder when document is empty', () => {
    const emptyDoc: DocumentModel = {
      blocks: [
        {
          id: 'block-1',
          type: 'paragraph',
          text: '',
          marks: {}
        }
      ]
    };

    render(<Editor value={emptyDoc} placeholder="Start writing..." />);
    expect(screen.getByText('Start writing...')).toBeInTheDocument();
  });

  it('renders only configured toolbar items in provided order', () => {
    render(
      <Editor
        toolbar={['undo', 'redo', 'bold', 'italic', 'underline']}
      />
    );

    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Underline' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Insert Image' })).not.toBeInTheDocument();
  });

  it('supports custom toolbar button and plugin button injection', () => {
    const customClick = vi.fn();

    render(
      <Editor
        toolbar={[
          'bold',
          {
            id: 'signature',
            icon: <span aria-hidden="true">SG</span>,
            tooltip: 'Insert Signature',
            onClick: customClick,
            section: 'insert'
          }
        ]}
        plugins={[
          {
            id: 'diagram',
            toolbar: [
              {
                id: 'diagram',
                icon: <span aria-hidden="true">DG</span>,
                tooltip: 'Insert Diagram',
                onClick: () => {}
              }
            ]
          }
        ]}
      />
    );

    const signature = screen.getByRole('button', { name: 'Insert Signature' });
    const diagram = screen.getByRole('button', { name: 'Insert Diagram' });
    expect(signature).toBeInTheDocument();
    expect(diagram).toBeInTheDocument();

    fireEvent.click(signature);
    expect(customClick).toHaveBeenCalledTimes(1);
  });

  it('keeps primary row visible when collapsed', () => {
    render(<Editor />);

    fireEvent.click(screen.getByRole('button', { name: 'Collapse toolbar row' }));
    expect(screen.getByRole('button', { name: 'Expand toolbar row' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Insert Image' })).not.toBeInTheDocument();
  });

  it('inserts a visible table from toolbar action', () => {
    const { container } = render(<Editor toolbar={['table']} />);

    fireEvent.click(screen.getByRole('button', { name: 'Insert Table' }));

    const insertedTable = container.querySelector('table');
    expect(insertedTable).not.toBeNull();
    expect(container.querySelectorAll('table td')).toHaveLength(9);
  });

  it('places caret at the end when editor receives focus', () => {
    const { container } = render(<Editor />);
    const editable = container.querySelector('[contenteditable="true"]') as HTMLElement;

    fireEvent.focus(editable);

    const selection = window.getSelection();
    expect(selection).not.toBeNull();
    expect(selection?.rangeCount).toBeGreaterThan(0);

    const range = selection?.getRangeAt(0);
    expect(range?.collapsed).toBe(true);
  });

  it('inserts a checklist with a real checkbox from toolbar action', () => {
    const { container } = render(<Editor toolbar={['checkList']} />);

    fireEvent.click(screen.getByRole('button', { name: 'Checklist' }));

    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox).not.toBeNull();
    expect(container.querySelector('ul[data-rze-checklist-id]')).not.toBeNull();
  });

  it('inserts an image through the inline URL popover', () => {
    const { container } = render(<Editor toolbar={['image']} />);
    const editable = container.querySelector('[contenteditable="true"]') as HTMLElement;
    fireEvent.focus(editable);

    fireEvent.click(screen.getByRole('button', { name: 'Insert Image' }));

    const input = screen.getByLabelText('Image URL') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'https://example.com/pic.png' } });
    fireEvent.click(screen.getByText('Insert'));

    const image = container.querySelector('img');
    expect(image).not.toBeNull();
    expect(image?.getAttribute('src')).toBe('https://example.com/pic.png');
    expect(screen.queryByLabelText('Image URL')).not.toBeInTheDocument();
  });

  it('does not insert literal sub/sup labels', () => {
    const { container } = render(<Editor toolbar={['subscript', 'superscript']} />);

    fireEvent.click(screen.getByRole('button', { name: 'Subscript' }));
    fireEvent.click(screen.getByRole('button', { name: 'Superscript' }));

    expect(container.textContent).not.toContain('sub');
    expect(container.textContent).not.toContain('sup');
  });

  it('inserts a hyperlink through the link dialog with new-tab option', () => {
    const { container } = render(<Editor toolbar={['link']} />);
    const editable = container.querySelector('[contenteditable="true"]') as HTMLElement;
    fireEvent.focus(editable);

    fireEvent.click(screen.getByRole('button', { name: 'Insert Link' }));

    fireEvent.change(screen.getByLabelText('Link display text'), { target: { value: 'Zenith' } });
    fireEvent.change(screen.getByLabelText('Link URL'), { target: { value: 'https://example.com/docs' } });
    fireEvent.click(screen.getByLabelText('Open in new tab'));
    fireEvent.click(screen.getByText('Insert'));

    const anchor = container.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor?.textContent).toBe('Zenith');
    expect(anchor?.getAttribute('href')).toBe('https://example.com/docs');
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.queryByLabelText('Link URL')).not.toBeInTheDocument();
  });

  it('rejects non-http(s) URLs in the link dialog', () => {
    const { container } = render(<Editor toolbar={['link']} />);
    const editable = container.querySelector('[contenteditable="true"]') as HTMLElement;
    fireEvent.focus(editable);

    fireEvent.click(screen.getByRole('button', { name: 'Insert Link' }));
    fireEvent.change(screen.getByLabelText('Link display text'), { target: { value: 'Bad' } });
    fireEvent.change(screen.getByLabelText('Link URL'), { target: { value: 'javascript:alert(1)' } });
    fireEvent.click(screen.getByText('Insert'));

    expect(container.querySelector('a')).toBeNull();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Link URL')).toBeInTheDocument();
  });

  it('uploads an image through the hidden file input', async () => {
    const { container } = render(<Editor toolbar={['uploadImage']} />);
    const editable = container.querySelector('[contenteditable="true"]') as HTMLElement;
    fireEvent.focus(editable);

    const fileInput = screen.getByLabelText('Upload image file') as HTMLInputElement;
    const file = new File(['hello'], 'photo.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(container.querySelector('img[data-rze-media="image"]')).not.toBeNull();
    });
    expect(container.querySelector('img[data-rze-media="image"]')?.getAttribute('src')).toMatch(/^data:image\/png/);
  });

  it('rejects an unsupported file type with an error message', async () => {
    const { container } = render(<Editor toolbar={['uploadImage']} />);
    const editable = container.querySelector('[contenteditable="true"]') as HTMLElement;
    fireEvent.focus(editable);

    const fileInput = screen.getByLabelText('Upload image file') as HTMLInputElement;
    const file = new File(['data'], 'clip.mp4', { type: 'video/mp4' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(container.querySelector('img[data-rze-media="image"]')).toBeNull();
  });
});
