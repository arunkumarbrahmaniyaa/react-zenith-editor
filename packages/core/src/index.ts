export type BlockType = 'paragraph' | 'heading' | 'quote';

export type Block = {
  id: string;
  type: BlockType;
  text: string;
  marks?: Record<string, boolean>;
};

export type DocumentModel = {
  blocks: Block[];
};

function createBlockId(): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  return `block-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function createDocument(initialText = 'Hello world'): DocumentModel {
  return {
    blocks: [
      {
        id: createBlockId(),
        type: 'paragraph',
        text: initialText,
        marks: {}
      }
    ]
  };
}

export function insertParagraph(doc: DocumentModel, afterBlockId: string): DocumentModel {
  const index = doc.blocks.findIndex((block) => block.id === afterBlockId);
  if (index === -1) {
    return doc;
  }

  const nextBlocks = [...doc.blocks];
  nextBlocks.splice(index + 1, 0, {
    id: createBlockId(),
    type: 'paragraph',
    text: '',
    marks: {}
  });

  return {
    ...doc,
    blocks: nextBlocks
  };
}

export function toggleMark(doc: DocumentModel, blockId: string, mark: string): DocumentModel {
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== blockId) {
        return block;
      }

      const nextMarks = { ...(block.marks ?? {}) };
      nextMarks[mark] = !nextMarks[mark];

      return { ...block, marks: nextMarks };
    })
  };
}

export function toHTML(doc: DocumentModel): string {
  const html = doc.blocks
    .map((block) => `<p>${block.text}</p>`)
    .join('');

  return `<article>${html}</article>`;
}

export function toMarkdown(doc: DocumentModel): string {
  return doc.blocks.map((block) => block.text).join('\n');
}
