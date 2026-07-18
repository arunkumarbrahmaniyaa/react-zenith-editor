import { describe, expect, it } from 'vitest';
import { createDocument, insertParagraph, toggleMark, toHTML, toMarkdown } from '../index';

describe('document model', () => {
  it('creates an empty document', () => {
    const doc = createDocument();
    expect(doc.blocks).toHaveLength(1);
    expect(doc.blocks[0].type).toBe('paragraph');
  });

  it('inserts a new paragraph after the current one', () => {
    const doc = createDocument();
    const next = insertParagraph(doc, doc.blocks[0].id);
    expect(next.blocks).toHaveLength(2);
  });

  it('toggles marks on a block', () => {
    const doc = createDocument();
    const next = toggleMark(doc, doc.blocks[0].id, 'bold');
    expect(next.blocks[0].marks?.bold).toBe(true);
  });

  it('serializes to html and markdown', () => {
    const doc = createDocument();
    const html = toHTML(doc);
    const markdown = toMarkdown(doc);
    expect(html).toContain('<p>');
    expect(markdown).toContain('Hello');
  });
});
