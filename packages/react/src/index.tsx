import React from 'react';
import { createPortal } from 'react-dom';
import { createDocument, type DocumentModel } from '@react-zenith-editor/core';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  ChevronDown,
  Eraser,
  FileVideo,
  Highlighter,
  Image,
  ImagePlus,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Palette,
  Printer,
  Redo2,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  Trash2,
  Type,
  Underline,
  Undo2,
  Upload,
  Video,
  X
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export type ToolbarSection =
  | 'editing'
  | 'formatting'
  | 'lists'
  | 'insert'
  | 'layout'
  | 'review'
  | 'ai'
  | 'developer';

export type BuiltInToolbarId =
  | 'undo'
  | 'redo'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'fontSize'
  | 'fontFamily'
  | 'textColor'
  | 'highlight'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'justify'
  | 'orderedList'
  | 'bulletList'
  | 'checkList'
  | 'link'
  | 'image'
  | 'video'
  | 'uploadImage'
  | 'uploadVideo'
  | 'table'
  | 'subscript'
  | 'superscript'
  | 'indent'
  | 'outdent'
  | 'clearFormatting'
  | 'codeBlock'
  | 'print';

export type ToolbarCommandContext = {
  runCommand: (command: string, value?: string) => void;
  getDocument: () => DocumentModel;
  setDocument: (nextDocument: DocumentModel) => void;
};

export type ToolbarFeatureDefinition = {
  id: BuiltInToolbarId;
  icon: React.ComponentType<{ size?: number }>;
  tooltip: string;
  command: (context: ToolbarCommandContext) => void;
  shortcut?: string;
  visible?: boolean;
  enabled?: boolean;
  section: ToolbarSection;
  row?: 'primary' | 'secondary';
};

export type CustomToolbarButton = {
  id: string;
  icon: React.ReactNode;
  tooltip: string;
  onClick: (context: ToolbarCommandContext) => void;
  shortcut?: string;
  visible?: boolean;
  enabled?: boolean;
  loading?: boolean;
  section?: ToolbarSection;
  row?: 'primary' | 'secondary';
};

export type ToolbarItem = BuiltInToolbarId | CustomToolbarButton;

export type EditorPlugin = {
  id: string;
  toolbar?: ToolbarItem[];
};

type ToolbarTheme = 'light' | 'dark' | 'minimal' | 'glass' | 'material' | 'bootstrap' | 'tailwind' | 'corporate';
type ToolbarSize = 'small' | 'medium' | 'large' | 'compact' | 'touch';
type ToolbarVariant = 'default' | 'filled' | 'outlined';
type ToolbarPosition = 'top' | 'bottom' | 'left' | 'right' | 'floating' | 'inline';

export type EditorProps = {
  value?: DocumentModel;
  placeholder?: string;
  onChange?: (value: DocumentModel) => void;
  toolbar?: ToolbarItem[];
  toolbarPosition?: ToolbarPosition;
  toolbarSticky?: boolean;
  toolbarWrap?: boolean;
  toolbarRounded?: boolean;
  toolbarShadow?: boolean;
  toolbarSize?: ToolbarSize;
  toolbarVariant?: ToolbarVariant;
  toolbarTheme?: ToolbarTheme;
  toolbarDisabledSections?: ToolbarSection[];
  toolbarFeatures?: ToolbarFeatureDefinition[];
  plugins?: EditorPlugin[];
  showTooltips?: boolean;
  showDividers?: boolean;
  iconSize?: number;
  buttonSize?: number;
  toolbarGap?: number;
  maxImageSizeMB?: number;
  maxVideoSizeMB?: number;
  allowedImageTypes?: string[];
  allowedVideoTypes?: string[];
  onImageUpload?: (file: File) => Promise<string>;
  onVideoUpload?: (file: File) => Promise<string>;
};

const DEFAULT_TOOLBAR: ToolbarItem[] = [
  'undo',
  'redo',
  'bold',
  'italic',
  'underline',
  'strike',
  'fontFamily',
  'fontSize',
  'textColor',
  'highlight',
  'alignLeft',
  'alignCenter',
  'alignRight',
  'justify',
  'orderedList',
  'bulletList',
  'checkList',
  'link',
  'image',
  'video',
  'uploadImage',
  'uploadVideo',
  'table',
  'subscript',
  'superscript',
  'outdent',
  'indent',
  'clearFormatting',
  'codeBlock',
  'print'
];

const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
const DEFAULT_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const DEFAULT_MAX_IMAGE_MB = 10;
const DEFAULT_MAX_VIDEO_MB = 100;

const mediaOverlayButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  border: 'none',
  borderRadius: 4,
  background: 'transparent',
  color: '#f9fafb',
  cursor: 'pointer'
};

const mediaOverlayTextButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 24,
  padding: '0 6px',
  border: 'none',
  borderRadius: 4,
  background: 'transparent',
  color: '#f9fafb',
  cursor: 'pointer',
  fontSize: 11
};

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FONT_FAMILIES: { label: string; value: string }[] = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif' },
  { label: 'Segoe UI', value: '"Segoe UI", Roboto, sans-serif' },
  { label: 'Roboto', value: 'Roboto, "Segoe UI", sans-serif' },
  { label: 'Open Sans', value: '"Open Sans", Arial, sans-serif' },
  { label: 'Lato', value: 'Lato, "Helvetica Neue", sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, Arial, sans-serif' },
  { label: 'Poppins', value: 'Poppins, Arial, sans-serif' },
  { label: 'Work Sans', value: '"Work Sans", "Segoe UI", sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Garamond', value: 'Garamond, "Times New Roman", serif' },
  { label: 'Palatino', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { label: 'Merriweather', value: 'Merriweather, Georgia, serif' },
  { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
  { label: 'Libre Baskerville', value: '"Libre Baskerville", Georgia, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Consolas', value: 'Consolas, "Courier New", monospace' },
  { label: 'Monaco', value: 'Monaco, Consolas, monospace' },
  { label: 'Fira Code', value: '"Fira Code", Consolas, monospace' },
  { label: 'JetBrains Mono', value: '"JetBrains Mono", Consolas, monospace' },
  { label: 'Source Code Pro', value: '"Source Code Pro", Consolas, monospace' },
  { label: 'Inter', value: 'Inter, "Segoe UI", sans-serif' },
  { label: 'Nunito', value: 'Nunito, "Segoe UI", sans-serif' },
  { label: 'Raleway', value: 'Raleway, Arial, sans-serif' },
  { label: 'Oswald', value: 'Oswald, "Arial Narrow", sans-serif' },
  { label: 'Bebas Neue', value: '"Bebas Neue", Oswald, sans-serif' },
  { label: 'PT Sans', value: '"PT Sans", Arial, sans-serif' },
  { label: 'PT Serif', value: '"PT Serif", Georgia, serif' },
  { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
  { label: 'Cambria', value: 'Cambria, Georgia, serif' },
  { label: 'Bookman', value: '"Bookman Old Style", serif' },
  { label: 'Century Gothic', value: '"Century Gothic", "Apple Gothic", sans-serif' },
  { label: 'Franklin Gothic', value: '"Franklin Gothic Medium", Arial, sans-serif' },
  { label: 'Gill Sans', value: '"Gill Sans", "Gill Sans MT", sans-serif' },
  { label: 'Futura', value: 'Futura, "Trebuchet MS", sans-serif' },
  { label: 'Optima', value: 'Optima, Segoe, Candara, sans-serif' },
  { label: 'Rockwell', value: 'Rockwell, "Courier Bold", serif' },
  { label: 'Baskerville', value: 'Baskerville, "Baskerville Old Face", serif' },
  { label: 'Didot', value: 'Didot, "Didot LT STD", "Times New Roman", serif' },
  { label: 'Copperplate', value: 'Copperplate, "Copperplate Gothic Light", serif' },
  { label: 'Lucida Console', value: '"Lucida Console", Monaco, monospace' },
  { label: 'Lucida Sans', value: '"Lucida Sans Unicode", "Lucida Grande", sans-serif' },
  { label: 'Cascadia Code', value: '"Cascadia Code", Consolas, monospace' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", "Comic Sans", cursive' },
  { label: 'Brush Script MT', value: '"Brush Script MT", cursive' },
  { label: 'Dancing Script', value: '"Dancing Script", cursive' },
  { label: 'Pacifico', value: 'Pacifico, cursive' },
  { label: 'Lobster', value: 'Lobster, cursive' },
  { label: 'Impact', value: 'Impact, Charcoal, sans-serif' }
];

const FONT_SIZES = [
  '8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '22px', '24px',
  '26px', '28px', '30px', '32px', '36px', '40px', '44px', '48px', '50px'
];

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 200;

const RZE_PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  .rze-editor-root, .rze-editor-root * { visibility: visible !important; }
  .rze-no-print, .rze-toolbar, .rze-editor-root [role="dialog"],
  .rze-editor-root [role="status"], .rze-editor-root [role="alert"] { display: none !important; }
  .rze-editor-root {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: #ffffff !important;
    overflow: visible !important;
  }
  .rze-editor-root .rze-content {
    background: #ffffff !important;
    color: #000000 !important;
    padding: 0 !important;
    min-height: 0 !important;
  }
  .rze-editor-root .rze-content a { color: #0645ad !important; text-decoration: underline !important; }
  .rze-editor-root .rze-content table,
  .rze-editor-root .rze-content th,
  .rze-editor-root .rze-content td { border: 1px solid #000 !important; }
  .rze-editor-root .rze-content img,
  .rze-editor-root .rze-content video { max-width: 100% !important; }
}
`;

interface ToolbarDropdownTheme {
  border: string;
  buttonBg: string;
  text: string;
  hover: string;
  focus: string;
}

interface ToolbarDropdownOption {
  label: string;
  value: string;
  optionStyle?: React.CSSProperties;
}

interface ToolbarDropdownProps {
  ariaLabel: string;
  value: string;
  displayLabel: string;
  options: ToolbarDropdownOption[];
  onOpen: () => void;
  onSelect: (value: string) => void;
  theme: ToolbarDropdownTheme;
  height: number;
  rounded: boolean;
  buttonWidth: number;
  menuWidth: number;
  disabled?: boolean;
  showTooltips?: boolean;
  searchable?: boolean;
}

function ToolbarDropdown(props: ToolbarDropdownProps) {
  const { ariaLabel, value, displayLabel, options, onOpen, onSelect, theme, height, rounded, buttonWidth, menuWidth, disabled, showTooltips, searchable } = props;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = searchable && query.trim()
    ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const updateMenuPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPosition({ top: rect.bottom + 4, left: rect.left });
    }
  };

  const closeMenu = () => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  };

  const commitOption = (option: ToolbarDropdownOption | undefined) => {
    if (!option) {
      return;
    }
    onSelect(option.value);
    closeMenu();
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    updateMenuPosition();
    if (searchable) {
      const id = window.setTimeout(() => searchInputRef.current?.focus(), 0);
      void id;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideButton = buttonRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideButton && !insideMenu) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    const handleReposition = () => {
      closeMenu();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [open, searchable]);

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      commitOption(filteredOptions[activeIndex]);
    }
  };

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              zIndex: 2147483000,
              width: menuWidth,
              padding: 4,
              background: theme.buttonBg,
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              boxShadow: '0 6px 18px rgba(15, 23, 42, 0.18)'
            }}
          >
            {searchable ? (
              <input
                ref={searchInputRef}
                type="text"
                aria-label={`Search ${ariaLabel}`}
                placeholder="Search..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                style={{
                  width: '100%',
                  height: 30,
                  marginBottom: 4,
                  padding: '0 8px',
                  border: `1px solid ${theme.border}`,
                  borderRadius: 4,
                  background: '#ffffff',
                  color: '#1f2937',
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            ) : null}
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '6px 8px', fontSize: 13, color: theme.text, opacity: 0.7 }}>No matches</div>
              ) : null}
              {filteredOptions.map((option, index) => {
                const selected = option.value === value;
                const active = index === activeIndex;
                return (
                  <button
                    key={option.label}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={(event) => {
                      setActiveIndex(index);
                      if (!selected) {
                        event.currentTarget.style.background = theme.hover;
                      }
                    }}
                    onMouseLeave={(event) => {
                      if (!selected) {
                        event.currentTarget.style.background = 'transparent';
                      }
                    }}
                    onClick={() => commitOption(option)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 8px',
                      border: 'none',
                      borderRadius: 4,
                      background: selected ? theme.focus : active ? theme.hover : 'transparent',
                      color: selected ? '#ffffff' : theme.text,
                      cursor: 'pointer',
                      fontSize: 13,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      ...option.optionStyle
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={showTooltips ? ariaLabel : undefined}
        disabled={disabled}
        onMouseDown={(event) => {
          event.preventDefault();
          if (!disabled) {
            onOpen();
          }
        }}
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => {
              const next = !prev;
              if (!next) {
                setQuery('');
                setActiveIndex(0);
              }
              return next;
            });
          }
        }}
        style={{
          height,
          width: buttonWidth,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
          padding: '0 8px',
          borderRadius: rounded ? 4 : 0,
          border: `1px solid ${theme.border}`,
          background: theme.buttonBg,
          color: theme.text,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: 13
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayLabel}</span>
        <ChevronDown size={14} style={{ flexShrink: 0 }} />
      </button>
      {menu}
    </div>
  );
}

const COLOR_SWATCHES = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0'
];

interface ColorPopoverProps {
  kind: 'foreColor' | 'hiliteColor';
  anchor: { top: number; left: number } | null;
  theme: ToolbarDropdownTheme;
  onSelect: (color: string) => void;
  onClose: () => void;
}

function ColorPopover({ kind, anchor, theme, onSelect, onClose }: ColorPopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label={kind === 'foreColor' ? 'Text color picker' : 'Highlight color picker'}
      className="rze-no-print"
      style={{
        position: 'fixed',
        top: anchor?.top ?? 80,
        left: anchor?.left ?? 16,
        zIndex: 2147483000,
        width: 232,
        padding: 10,
        background: theme.buttonBg,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.18)'
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
        {COLOR_SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Color ${color}`}
            title={color}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(color)}
            style={{
              width: 18,
              height: 18,
              padding: 0,
              borderRadius: 3,
              border: color.toLowerCase() === '#ffffff' ? '1px solid #d0d7de' : '1px solid rgba(0,0,0,0.1)',
              background: color,
              cursor: 'pointer'
            }}
          />
        ))}
      </div>
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12, color: theme.text, cursor: 'pointer' }}
      >
        <input
          type="color"
          aria-label={kind === 'foreColor' ? 'Custom text color' : 'Custom highlight color'}
          defaultValue="#000000"
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => onSelect(event.target.value)}
          style={{ width: 28, height: 24, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
        />
        Custom color
      </label>
    </div>
  );
}

interface FontSizeControlProps {
  value: string;
  onOpen: () => void;
  onApply: (value: string) => void;
  theme: ToolbarDropdownTheme;
  height: number;
  rounded: boolean;
}

function FontSizeControl({ value, onOpen, onApply, theme, height, rounded }: FontSizeControlProps) {
  const currentNumber = parseInt(value, 10) || 16;
  const [text, setText] = useState(String(currentNumber));
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(String(currentNumber));
  }, [currentNumber]);

  const clamp = (n: number) => Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, n));

  const applySize = (n: number) => {
    const clamped = clamp(n);
    setText(String(clamped));
    onOpen();
    onApply(`${clamped}px`);
  };

  const commitText = () => {
    const parsed = parseInt(text, 10);
    if (Number.isNaN(parsed)) {
      setText(String(currentNumber));
      return;
    }
    applySize(parsed);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPosition({ top: rect.bottom + 4, left: rect.left });
    }
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const handleReposition = () => setOpen(false);
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [open]);

  const stepButtonStyle: React.CSSProperties = {
    width: 20,
    height,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${theme.border}`,
    background: theme.buttonBg,
    color: theme.text,
    cursor: 'pointer',
    fontSize: 13,
    padding: 0
  };

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label="Font Size"
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              zIndex: 2147483000,
              width: 72,
              maxHeight: 220,
              overflowY: 'auto',
              padding: 4,
              background: theme.buttonBg,
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              boxShadow: '0 6px 18px rgba(15, 23, 42, 0.18)'
            }}
          >
            {FONT_SIZES.map((size) => {
              const n = parseInt(size, 10);
              const selected = n === currentNumber;
              return (
                <button
                  key={size}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    applySize(n);
                    setOpen(false);
                  }}
                  onMouseEnter={(event) => {
                    if (!selected) {
                      event.currentTarget.style.background = theme.hover;
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (!selected) {
                      event.currentTarget.style.background = 'transparent';
                    }
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 8px',
                    border: 'none',
                    borderRadius: 4,
                    background: selected ? theme.focus : 'transparent',
                    color: selected ? '#ffffff' : theme.text,
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={containerRef} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        aria-label="Decrease font size"
        title="Decrease font size"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => applySize(currentNumber - 1)}
        style={{ ...stepButtonStyle, borderRadius: rounded ? '4px 0 0 4px' : 0, borderRight: 'none' }}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label="Font Size"
        value={text}
        onMouseDown={onOpen}
        onChange={(event) => setText(event.target.value.replace(/[^0-9]/g, ''))}
        onBlur={commitText}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitText();
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            applySize(currentNumber + 1);
          } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            applySize(currentNumber - 1);
          }
        }}
        style={{
          width: 34,
          height,
          textAlign: 'center',
          border: `1px solid ${theme.border}`,
          background: '#ffffff',
          color: '#1f2937',
          fontSize: 13,
          padding: 0,
          boxSizing: 'border-box'
        }}
      />
      <button
        type="button"
        aria-label="Increase font size"
        title="Increase font size"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => applySize(currentNumber + 1)}
        style={{ ...stepButtonStyle, borderLeft: 'none', borderRight: 'none' }}
      >
        +
      </button>
      <button
        type="button"
        aria-label="Font size options"
        aria-haspopup="listbox"
        aria-expanded={open}
        onMouseDown={(event) => {
          event.preventDefault();
          onOpen();
        }}
        onClick={() => setOpen((prev) => !prev)}
        style={{ ...stepButtonStyle, width: 22, borderRadius: rounded ? '0 4px 4px 0' : 0 }}
      >
        <ChevronDown size={14} />
      </button>
      {menu}
    </div>
  );
}

function mergeDocuments(previous: DocumentModel, nextText: string): DocumentModel {
  const firstBlock = previous.blocks[0];
  if (!firstBlock) {
    return previous;
  }

  return {
    ...previous,
    blocks: [{ ...firstBlock, text: nextText }, ...previous.blocks.slice(1)]
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function documentToInitialHtml(model: DocumentModel): string {
  const firstBlock = model.blocks[0];
  const text = firstBlock?.text ?? '';
  if (!text.trim()) {
    return '';
  }

  return escapeHtml(text).replaceAll('\n', '<br>');
}

function generateTableMarkup(rows: number, columns: number, tableId: string): string {
  const columnWidth = (100 / columns).toFixed(4);
  const colGroup = Array.from({ length: columns }, () => `<col style="width:${columnWidth}%;" />`).join('');
  const cells = Array.from({ length: rows }, () =>
    `<tr>${Array.from({ length: columns }, () => '<td style="border:1px solid #9ca3af;padding:6px;vertical-align:top;">\u00A0</td>').join('')}</tr>`
  ).join('');

  return (
    `<table data-rze-table-id="${tableId}" style="border-collapse:collapse;table-layout:fixed;width:100%;margin:8px 0;">` +
    `<colgroup>${colGroup}</colgroup><tbody>${cells}</tbody></table><p>\u00A0</p>`
  );
}

function buildChecklistItemMarkup(text: string): string {
  return (
    '<li style="display:flex;align-items:flex-start;gap:8px;">' +
    '<input type="checkbox" contenteditable="false" style="margin-top:4px;cursor:pointer;" />' +
    `<span>${text}</span>` +
    '</li>'
  );
}

export function Editor({
  value,
  placeholder = 'Start writing...',
  onChange,
  toolbar,
  toolbarPosition = 'top',
  toolbarSticky = false,
  toolbarWrap = true,
  toolbarRounded = true,
  toolbarShadow = false,
  toolbarSize = 'medium',
  toolbarVariant = 'default',
  toolbarTheme = 'light',
  toolbarDisabledSections = [],
  toolbarFeatures,
  plugins = [],
  showTooltips = true,
  showDividers = true,
  iconSize,
  buttonSize,
  toolbarGap = 6,
  maxImageSizeMB = DEFAULT_MAX_IMAGE_MB,
  maxVideoSizeMB = DEFAULT_MAX_VIDEO_MB,
  allowedImageTypes = DEFAULT_IMAGE_TYPES,
  allowedVideoTypes = DEFAULT_VIDEO_TYPES,
  onImageUpload,
  onVideoUpload
}: EditorProps) {
  const [doc, setDoc] = useState<DocumentModel>(() => value ?? createDocument());
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(true);
  const [fontFamily, setFontFamily] = useState('');
  const [fontSize, setFontSize] = useState('16px');
  const [isEditorEmpty, setIsEditorEmpty] = useState(false);
  const [insertPrompt, setInsertPrompt] = useState<{ type: 'image' | 'video' } | null>(null);
  const [insertValue, setInsertValue] = useState('');
  const [linkDialog, setLinkDialog] = useState<{ text: string; url: string; newTab: boolean; editing: boolean } | null>(null);
  const isLinkDialogOpen = linkDialog !== null;
  const [uploadState, setUploadState] = useState<{ name: string; progress: number; kind: 'image' | 'video' } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mediaBox, setMediaBox] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ top: number; left: number } | null>(null);
  const [colorPicker, setColorPicker] = useState<{ kind: 'foreColor' | 'hiliteColor' } | null>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const promptSelectionRef = useRef<Range | null>(null);
  const insertInputRef = useRef<HTMLInputElement>(null);
  const linkTextInputRef = useRef<HTMLInputElement>(null);
  const selectedMediaRef = useRef<HTMLElement | null>(null);
  const editingAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const resizeStateRef = useRef<{ startX: number; startWidth: number; el: HTMLElement } | null>(null);
  const tableResizeRef = useRef<
    | {
        type: 'col' | 'row' | 'table';
        table: HTMLTableElement;
        startX: number;
        startY: number;
        cols?: HTMLElement[];
        colIndex?: number;
        startColWidths?: number[];
        row?: HTMLTableRowElement;
        startRowHeight?: number;
        startTableWidth?: number;
      }
    | null
  >(null);
  const isInternalChangeRef = useRef(false);

  useEffect(() => {
    if (value) {
      setDoc(value);
    }
  }, [value]);

  useEffect(() => {
    const editable = editableRef.current;
    if (!editable) {
      return;
    }

    // Skip re-rendering the DOM when the change originated from the user's own
    // typing/editing. Rewriting innerHTML here would destroy inline formatting,
    // block structure, and the caret position on every keystroke.
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      setIsEditorEmpty((editable.textContent ?? '').trim().length === 0);
      return;
    }

    const nextHtml = documentToInitialHtml(doc);
    if (editable.innerHTML !== nextHtml) {
      editable.innerHTML = nextHtml;
    }

    setIsEditorEmpty((editable.textContent ?? '').trim().length === 0);
  }, [doc]);

  useEffect(() => {
    const onSelectionChange = () => {
      const editable = editableRef.current;
      const selection = window.getSelection();
      if (!editable || !selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      if (editable.contains(range.commonAncestorContainer)) {
        savedSelectionRef.current = range.cloneRange();
      }
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, []);

  useEffect(() => {
    if (insertPrompt) {
      const input = insertInputRef.current;
      if (input) {
        input.focus();
        input.select();
      }
    }
  }, [insertPrompt]);

  useEffect(() => {
    if (isLinkDialogOpen) {
      const input = linkTextInputRef.current;
      if (input) {
        input.focus();
        input.select();
      }
    }
  }, [isLinkDialogOpen]);

  const isSelectionInsideEditor = () => {
    const selection = window.getSelection();
    const editable = editableRef.current;
    if (!selection || !editable || selection.rangeCount === 0) {
      return false;
    }

    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;
    return Boolean(anchorNode && focusNode && editable.contains(anchorNode) && editable.contains(focusNode));
  };

  const placeCaretAtEnd = () => {
    const editable = editableRef.current;
    if (!editable) {
      return;
    }

    editable.focus();
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const restoreSavedSelection = () => {
    const editable = editableRef.current;
    const saved = savedSelectionRef.current;
    const selection = window.getSelection();

    if (!editable || !saved || !selection) {
      return false;
    }

    if (!editable.contains(saved.commonAncestorContainer)) {
      return false;
    }

    selection.removeAllRanges();
    selection.addRange(saved);
    return true;
  };

  const focusEditor = (forceEnd = false) => {
    const editable = editableRef.current;
    if (!editable) {
      return;
    }

    editable.focus();
    if (forceEnd || (!isSelectionInsideEditor() && !restoreSavedSelection())) {
      placeCaretAtEnd();
    }
  };

  const insertHTMLAtCursor = (html: string) => {
    const editable = editableRef.current;
    if (!editable) {
      return;
    }

    focusEditor(false);
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editable.insertAdjacentHTML('beforeend', html);
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editable.contains(range.commonAncestorContainer)) {
      placeCaretAtEnd();
    }

    const safeSelection = window.getSelection();
    if (!safeSelection || safeSelection.rangeCount === 0) {
      editable.insertAdjacentHTML('beforeend', html);
      return;
    }

    const safeRange = safeSelection.getRangeAt(0);
    safeRange.deleteContents();

    const fragment = safeRange.createContextualFragment(html);
    const lastNode = fragment.lastChild;
    safeRange.insertNode(fragment);

    if (lastNode) {
      const nextRange = document.createRange();
      nextRange.setStartAfter(lastNode);
      nextRange.collapse(true);
      safeSelection.removeAllRanges();
      safeSelection.addRange(nextRange);
    }
  };

  const focusInsideElementStart = (element: Element | null) => {
    if (!element) {
      return;
    }

    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    savedSelectionRef.current = range.cloneRange();
  };

  const insertTableAtCursor = (rows = 3, columns = 3) => {
    const tableId = `rze-table-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    insertHTMLAtCursor(generateTableMarkup(rows, columns, tableId));

    const table = editableRef.current?.querySelector(`[data-rze-table-id="${tableId}"]`);
    const firstCell = table?.querySelector('td');
    focusInsideElementStart(firstCell ?? null);
  };

  const insertCodeBlockAtCursor = () => {
    insertHTMLAtCursor('<pre style="background:#111827;color:#e5e7eb;padding:10px;border-radius:6px;overflow:auto;margin:8px 0;font-family:\'Fira Code\',\'JetBrains Mono\',Consolas,monospace;white-space:pre-wrap;"><code>\u200B</code></pre><p>\u00A0</p>');
    const blocks = editableRef.current?.querySelectorAll('pre code');
    const target = blocks && blocks.length > 0 ? blocks[blocks.length - 1] : null;
    focusInsideElementStart(target);
  };

  const serializeRangeWithBreaks = (range: Range): string => {
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());
    return container.innerHTML
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, '\u00A0')
      .replace(/[\u200B]/g, '');
  };

  const handleCodeBlockKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const startElement =
      range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement;
    const pre = startElement?.closest('pre') as HTMLPreElement | null;
    if (!pre || !editableRef.current?.contains(pre)) {
      return false;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      document.execCommand('insertText', false, '  ');
      isInternalChangeRef.current = true;
      setDoc((current) => ({ ...current }));
      return true;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      const beforeRange = document.createRange();
      beforeRange.selectNodeContents(pre);
      beforeRange.setEnd(range.startContainer, range.startOffset);
      const beforeText = serializeRangeWithBreaks(beforeRange);

      const afterRange = document.createRange();
      afterRange.selectNodeContents(pre);
      afterRange.setStart(range.endContainer, range.endOffset);
      const afterText = serializeRangeWithBreaks(afterRange);

      const isAtEnd = afterText.replace(/[\s\u00A0]/g, '').length === 0;
      const isEmptyLine = beforeText.length === 0 || beforeText.endsWith('\n');

      if (isAtEnd && isEmptyLine) {
        // Double Enter on an empty trailing line: exit into a paragraph below.
        event.preventDefault();
        const breaks = pre.querySelectorAll('br');
        const lastBreak = breaks[breaks.length - 1];
        if (lastBreak) {
          lastBreak.remove();
        }
        const paragraph = document.createElement('p');
        paragraph.innerHTML = '<br />';
        pre.after(paragraph);
        focusInsideElementStart(paragraph);
        isInternalChangeRef.current = true;
        setDoc((current) => ({ ...current }));
        return true;
      }

      // Insert a line break inside the code block, keeping the caret after it.
      event.preventDefault();
      range.deleteContents();
      const lineBreak = document.createElement('br');
      range.insertNode(lineBreak);
      const caret = document.createRange();
      caret.setStartAfter(lineBreak);
      caret.collapse(true);
      selection.removeAllRanges();
      selection.addRange(caret);
      isInternalChangeRef.current = true;
      setDoc((current) => ({ ...current }));
      return true;
    }

    return false;
  };

  const insertCheckListAtCursor = () => {
    const listId = `rze-checklist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    insertHTMLAtCursor(
      `<ul data-rze-checklist-id="${listId}" style="list-style:none;margin:8px 0;padding-left:2px;">` +
        buildChecklistItemMarkup('Checklist item') +
        '</ul><p><br /></p>'
    );

    const list = editableRef.current?.querySelector(`[data-rze-checklist-id="${listId}"]`);
    const textSpan = list?.querySelector('li span');
    focusInsideElementStart(textSpan ?? null);
  };

  const findChecklistItem = (node: Node | null): HTMLLIElement | null => {
    const element = node instanceof Element ? node : node?.parentElement ?? null;
    const li = element?.closest('li') as HTMLLIElement | null;
    if (li && li.closest('[data-rze-checklist-id]')) {
      return li;
    }
    return null;
  };

  const createChecklistItemElement = (text: string): HTMLLIElement => {
    const template = document.createElement('template');
    template.innerHTML = buildChecklistItemMarkup(text);
    return template.content.firstChild as HTMLLIElement;
  };

  const toggleChecklistCheckbox = (target: HTMLElement): boolean => {
    const checkbox = target.closest('input[type="checkbox"]') as HTMLInputElement | null;
    if (!checkbox || !checkbox.closest('[data-rze-checklist-id]')) {
      return false;
    }

    // Read the state after the native toggle has applied, then persist it to the
    // markup via the `checked` attribute so it survives serialization.
    window.requestAnimationFrame(() => {
      if (checkbox.checked) {
        checkbox.setAttribute('checked', 'checked');
      } else {
        checkbox.removeAttribute('checked');
      }
      const span = checkbox.parentElement?.querySelector('span') as HTMLElement | null;
      if (span) {
        span.style.textDecoration = checkbox.checked ? 'line-through' : 'none';
        span.style.opacity = checkbox.checked ? '0.6' : '1';
      }
      isInternalChangeRef.current = true;
      setDoc((current) => ({ ...current }));
    });
    return true;
  };

  const convertChecklistItemToParagraph = (li: HTMLLIElement) => {
    const list = li.closest('ul');
    if (!list) {
      return;
    }
    const paragraph = document.createElement('p');
    paragraph.innerHTML = '<br />';
    list.parentNode?.insertBefore(paragraph, list.nextSibling);
    li.remove();
    if (!list.querySelector('li')) {
      list.remove();
    }
    focusInsideElementStart(paragraph);
    isInternalChangeRef.current = true;
    setDoc((current) => ({ ...current }));
  };

  const handleChecklistKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);

    if (event.key === ' ') {
      let block: HTMLElement | null =
        range.startContainer instanceof HTMLElement
          ? range.startContainer
          : (range.startContainer.parentElement as HTMLElement | null);
      while (block && block.parentElement && block.parentElement !== editableRef.current) {
        block = block.parentElement;
      }
      const blockText = block?.textContent?.trim() ?? '';
      if (block && block.tagName !== 'UL' && !block.closest('[data-rze-checklist-id]') && (blockText === '[]' || blockText === '[ ]')) {
        event.preventDefault();
        const list = document.createElement('ul');
        list.setAttribute('data-rze-checklist-id', `rze-checklist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
        list.setAttribute('style', 'list-style:none;margin:8px 0;padding-left:2px;');
        list.appendChild(createChecklistItemElement(''));
        block.replaceWith(list);
        focusInsideElementStart(list.querySelector('span'));
        isInternalChangeRef.current = true;
        setDoc((current) => ({ ...current }));
        return true;
      }
    }

    const li = findChecklistItem(range.startContainer);
    if (!li) {
      return false;
    }

    const span = li.querySelector('span') as HTMLElement | null;
    const isEmpty = (span?.textContent ?? '').trim().length === 0;

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (isEmpty) {
        convertChecklistItemToParagraph(li);
        return true;
      }
      const newItem = createChecklistItemElement('');
      li.after(newItem);
      focusInsideElementStart(newItem.querySelector('span'));
      isInternalChangeRef.current = true;
      setDoc((current) => ({ ...current }));
      return true;
    }

    if (event.key === 'Backspace' && isEmpty) {
      event.preventDefault();
      const parentList = li.closest('ul');
      const parentItem = parentList?.parentElement?.closest('li') as HTMLLIElement | null;
      if (parentItem) {
        // Nested item: outdent one level.
        parentItem.after(li);
        if (parentList && !parentList.querySelector('li')) {
          parentList.remove();
        }
        focusInsideElementStart(li.querySelector('span'));
        isInternalChangeRef.current = true;
        setDoc((current) => ({ ...current }));
      } else {
        convertChecklistItemToParagraph(li);
      }
      return true;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) {
        const parentList = li.closest('ul');
        const parentItem = parentList?.parentElement?.closest('li') as HTMLLIElement | null;
        if (parentItem) {
          parentItem.after(li);
          if (parentList && !parentList.querySelector('li')) {
            parentList.remove();
          }
        }
      } else {
        const previous = li.previousElementSibling as HTMLElement | null;
        if (previous) {
          let nestedList = previous.querySelector(':scope > ul[data-rze-checklist-id]') as HTMLUListElement | null;
          if (!nestedList) {
            nestedList = document.createElement('ul');
            nestedList.setAttribute('data-rze-checklist-id', `rze-checklist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
            nestedList.setAttribute('style', 'list-style:none;margin:4px 0;padding-left:22px;');
            previous.appendChild(nestedList);
          }
          nestedList.appendChild(li);
        }
      }
      focusInsideElementStart(li.querySelector('span'));
      isInternalChangeRef.current = true;
      setDoc((current) => ({ ...current }));
      return true;
    }

    return false;
  };

  const saveEditorSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editableRef.current?.contains(range.commonAncestorContainer)) {
        savedSelectionRef.current = range.cloneRange();
      }
    }
  };

  const applyInlineStyleToSelection = (styleProp: 'fontFamily' | 'fontSize', value: string) => {
    focusEditor(false);

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed || !editableRef.current?.contains(range.commonAncestorContainer)) {
      return;
    }

    const span = document.createElement('span');
    span.style[styleProp] = value;

    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);

      const nextRange = document.createRange();
      nextRange.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(nextRange);
      savedSelectionRef.current = nextRange.cloneRange();
    } catch {
      // If the selection spans structural boundaries that cannot be wrapped,
      // silently ignore rather than corrupting the document.
      return;
    }

    setIsEditorEmpty((editableRef.current?.textContent ?? '').trim().length === 0);
  };

  const runCommand = (command: string, valueToApply?: string) => {
    focusEditor(false);

    if (command === 'insertHTML' && valueToApply) {
      let usedNativeInsert = false;
      if (typeof document.execCommand === 'function') {
        usedNativeInsert = document.execCommand('insertHTML', false, valueToApply);
      }

      if (!usedNativeInsert) {
        insertHTMLAtCursor(valueToApply);
      }

      setIsEditorEmpty((editableRef.current?.textContent ?? '').trim().length === 0);
      return;
    }

    if (typeof document.execCommand === 'function') {
      document.execCommand(command, false, valueToApply);
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }

    setIsEditorEmpty((editableRef.current?.textContent ?? '').trim().length === 0);
  };

  const openInsertPrompt = (type: 'image' | 'video') => {
    const editable = editableRef.current;
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editable?.contains(range.commonAncestorContainer)) {
        promptSelectionRef.current = range.cloneRange();
      }
    }

    if (!promptSelectionRef.current && editable) {
      editable.focus();
      placeCaretAtEnd();
      const nextSelection = window.getSelection();
      if (nextSelection && nextSelection.rangeCount > 0) {
        promptSelectionRef.current = nextSelection.getRangeAt(0).cloneRange();
      }
    }

    setInsertValue('');
    setInsertPrompt({ type });
  };

  const closeInsertPrompt = () => {
    setInsertPrompt(null);
    setInsertValue('');
  };

  const restorePromptSelection = () => {
    const editable = editableRef.current;
    const savedRange = promptSelectionRef.current;
    editable?.focus();
    if (savedRange && editable?.contains(savedRange.commonAncestorContainer)) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedRange);
      savedSelectionRef.current = savedRange.cloneRange();
    }
  };

  const confirmInsertPrompt = () => {
    if (!insertPrompt) {
      return;
    }

    const url = insertValue.trim();
    if (!url) {
      closeInsertPrompt();
      return;
    }

    if (!isValidHttpUrl(url)) {
      setUploadError('Please enter a valid http(s) URL.');
      return;
    }

    restorePromptSelection();

    if (insertPrompt.type === 'image') {
      runCommand('insertHTML', buildImageMarkup(url));
    } else {
      runCommand('insertHTML', buildVideoMarkup(url));
    }

    promptSelectionRef.current = null;
    closeInsertPrompt();
  };

  const buildImageMarkup = (src: string) =>
    `<img src="${escapeHtml(src)}" alt="" data-rze-media="image" style="max-width:100%;height:auto;display:inline-block;" />`;

  const buildVideoMarkup = (src: string) => {
    if (isValidHttpUrl(src) && !src.startsWith('data:') && !/\.(mp4|webm|ogg|ogv|mov)(\?|$)/i.test(src)) {
      // A page URL (e.g. YouTube) rather than a direct video file: embed as link.
      return `<a href="${escapeHtml(src)}" target="_blank" rel="noopener noreferrer">${escapeHtml(src)}</a>`;
    }
    return `<video src="${escapeHtml(src)}" data-rze-media="video" controls style="max-width:100%;height:auto;display:inline-block;"></video>`;
  };

  const openLinkDialog = () => {
    const editable = editableRef.current;
    const selection = window.getSelection();
    let selectedText = '';
    editingAnchorRef.current = null;

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editable?.contains(range.commonAncestorContainer)) {
        promptSelectionRef.current = range.cloneRange();
        selectedText = range.toString();

        const anchorNode = range.commonAncestorContainer;
        const element = anchorNode instanceof Element ? anchorNode : anchorNode.parentElement;
        const anchor = element?.closest('a');
        if (anchor && editable.contains(anchor)) {
          editingAnchorRef.current = anchor as HTMLAnchorElement;
          setLinkDialog({
            text: anchor.textContent ?? '',
            url: anchor.getAttribute('href') ?? '',
            newTab: anchor.getAttribute('target') === '_blank',
            editing: true
          });
          return;
        }
      }
    }

    if (!promptSelectionRef.current && editable) {
      editable.focus();
      placeCaretAtEnd();
      const nextSelection = window.getSelection();
      if (nextSelection && nextSelection.rangeCount > 0) {
        promptSelectionRef.current = nextSelection.getRangeAt(0).cloneRange();
      }
    }

    setLinkDialog({ text: selectedText, url: '', newTab: false, editing: false });
  };

  const closeLinkDialog = () => {
    setLinkDialog(null);
    editingAnchorRef.current = null;
  };

  const confirmLinkDialog = () => {
    if (!linkDialog) {
      return;
    }

    const url = linkDialog.url.trim();
    if (!isValidHttpUrl(url)) {
      setUploadError('Please enter a valid http(s) link (must start with http:// or https://).');
      return;
    }

    const text = linkDialog.text.trim() || url;
    const targetAttr = linkDialog.newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const anchorHtml = `<a href="${escapeHtml(url)}"${targetAttr}>${escapeHtml(text)}</a>`;

    const editing = editingAnchorRef.current;
    if (editing && editableRef.current?.contains(editing)) {
      editing.outerHTML = anchorHtml;
      isInternalChangeRef.current = true;
      setDoc((current) => ({ ...current }));
    } else {
      restorePromptSelection();
      const activeSelection = window.getSelection();
      const collapsed = !activeSelection || activeSelection.rangeCount === 0 || activeSelection.getRangeAt(0).collapsed;
      if (!collapsed) {
        activeSelection?.getRangeAt(0).deleteContents();
      }
      runCommand('insertHTML', anchorHtml);
    }

    promptSelectionRef.current = null;
    editingAnchorRef.current = null;
    setUploadError(null);
    closeLinkDialog();
  };

  const removeLink = () => {
    const editing = editingAnchorRef.current;
    if (editing && editableRef.current?.contains(editing)) {
      const parent = editing.parentNode;
      while (editing.firstChild) {
        parent?.insertBefore(editing.firstChild, editing);
      }
      parent?.removeChild(editing);
      isInternalChangeRef.current = true;
      setDoc((current) => ({ ...current }));
    }
    editingAnchorRef.current = null;
    closeLinkDialog();
  };

  const openColorPicker = (kind: 'foreColor' | 'hiliteColor') => {
    saveEditorSelection();
    setColorPicker({ kind });
  };

  const applyColor = (kind: 'foreColor' | 'hiliteColor', color: string) => {
    focusEditor(false);
    runCommand(kind, color);
    setColorPicker(null);
  };

  const validateFile = (file: File, kind: 'image' | 'video'): string | null => {
    const allowed = kind === 'image' ? allowedImageTypes : allowedVideoTypes;
    const maxMB = kind === 'image' ? maxImageSizeMB : maxVideoSizeMB;

    if (allowed.length > 0 && !allowed.includes(file.type)) {
      return `Unsupported ${kind} format "${file.type || file.name}". Allowed: ${allowed
        .map((type) => type.split('/')[1])
        .join(', ')}.`;
    }

    if (file.size > maxMB * 1024 * 1024) {
      return `${kind === 'image' ? 'Image' : 'Video'} is too large (${formatBytes(file.size)}). Maximum allowed is ${maxMB} MB.`;
    }

    return null;
  };

  const readFileWithProgress = (file: File, kind: 'image' | 'video') =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadState({ name: file.name, progress, kind });
        }
      };
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  const handleUploadFiles = async (files: FileList | File[], kind: 'image' | 'video') => {
    const list = Array.from(files).filter((file) =>
      kind === 'image' ? file.type.startsWith('image/') : file.type.startsWith('video/')
    );

    const chosen = list[0] ?? Array.from(files)[0];
    if (!chosen) {
      return;
    }

    const validationError = validateFile(chosen, kind);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError(null);
    setUploadState({ name: chosen.name, progress: 0, kind });

    try {
      let src: string;
      const uploader = kind === 'image' ? onImageUpload : onVideoUpload;
      if (uploader) {
        setUploadState({ name: chosen.name, progress: 50, kind });
        src = await uploader(chosen);
      } else {
        src = await readFileWithProgress(chosen, kind);
      }

      setUploadState({ name: chosen.name, progress: 100, kind });
      restorePromptSelection();
      runCommand('insertHTML', kind === 'image' ? buildImageMarkup(src) : buildVideoMarkup(src));
    } catch {
      setUploadError(`Failed to upload ${chosen.name}.`);
    } finally {
      setUploadState(null);
    }
  };

  const triggerImageUpload = () => {
    const editable = editableRef.current;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editable?.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      promptSelectionRef.current = selection.getRangeAt(0).cloneRange();
    } else if (editable) {
      editable.focus();
      placeCaretAtEnd();
      const next = window.getSelection();
      if (next && next.rangeCount > 0) {
        promptSelectionRef.current = next.getRangeAt(0).cloneRange();
      }
    }
    imageFileInputRef.current?.click();
  };

  const triggerVideoUpload = () => {
    const editable = editableRef.current;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editable?.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      promptSelectionRef.current = selection.getRangeAt(0).cloneRange();
    } else if (editable) {
      editable.focus();
      placeCaretAtEnd();
      const next = window.getSelection();
      if (next && next.rangeCount > 0) {
        promptSelectionRef.current = next.getRangeAt(0).cloneRange();
      }
    }
    videoFileInputRef.current?.click();
  };

  const setCaretFromPoint = (x: number, y: number) => {
    const editable = editableRef.current;
    if (!editable) {
      return;
    }

    const doc2 = document as Document & {
      caretRangeFromPoint?: (x: number, y: number) => Range | null;
      caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    };

    let range: Range | null = null;
    if (typeof doc2.caretRangeFromPoint === 'function') {
      range = doc2.caretRangeFromPoint(x, y);
    } else if (typeof doc2.caretPositionFromPoint === 'function') {
      const position = doc2.caretPositionFromPoint(x, y);
      if (position) {
        range = document.createRange();
        range.setStart(position.offsetNode, position.offset);
        range.collapse(true);
      }
    }

    if (range && editable.contains(range.commonAncestorContainer)) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      promptSelectionRef.current = range.cloneRange();
      savedSelectionRef.current = range.cloneRange();
    } else {
      editable.focus();
      placeCaretAtEnd();
      const next = window.getSelection();
      if (next && next.rangeCount > 0) {
        promptSelectionRef.current = next.getRangeAt(0).cloneRange();
      }
    }
  };

  const handleEditorDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    event.preventDefault();
    setIsDragging(false);
    setCaretFromPoint(event.clientX, event.clientY);

    const file = files[0];
    if (file.type.startsWith('image/')) {
      void handleUploadFiles(files, 'image');
    } else if (file.type.startsWith('video/')) {
      void handleUploadFiles(files, 'video');
    } else {
      setUploadError(`Unsupported file type "${file.type || file.name}".`);
    }
  };

  const updateMediaBox = (element: HTMLElement) => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) {
      return;
    }
    const wrapperRect = wrapper.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    setMediaBox({
      top: rect.top - wrapperRect.top,
      left: rect.left - wrapperRect.left,
      width: rect.width,
      height: rect.height
    });
  };

  const selectMedia = (element: HTMLElement | null) => {
    selectedMediaRef.current = element;
    if (element) {
      updateMediaBox(element);
    } else {
      setMediaBox(null);
    }
  };

  const handleEditorClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLElement;
    if (toggleChecklistCheckbox(target)) {
      return;
    }
    const media = target.closest('[data-rze-media]') as HTMLElement | null;
    if (media) {
      selectMedia(media);
    } else {
      selectMedia(null);
    }
  };

  const alignSelectedMedia = (alignment: 'left' | 'center' | 'right') => {
    const element = selectedMediaRef.current;
    if (!element) {
      return;
    }
    element.style.display = 'block';
    if (alignment === 'left') {
      element.style.marginLeft = '0';
      element.style.marginRight = 'auto';
    } else if (alignment === 'center') {
      element.style.marginLeft = 'auto';
      element.style.marginRight = 'auto';
    } else {
      element.style.marginLeft = 'auto';
      element.style.marginRight = '0';
    }
    isInternalChangeRef.current = true;
    setDoc((current) => ({ ...current }));
    updateMediaBox(element);
  };

  const resizeSelectedMedia = (percentage: number) => {
    const element = selectedMediaRef.current;
    if (!element) {
      return;
    }
    element.style.width = `${percentage}%`;
    element.style.height = 'auto';
    isInternalChangeRef.current = true;
    setDoc((current) => ({ ...current }));
    updateMediaBox(element);
  };

  const removeSelectedMedia = () => {
    const element = selectedMediaRef.current;
    if (element && editableRef.current?.contains(element)) {
      element.remove();
      isInternalChangeRef.current = true;
      setDoc((current) => ({ ...current }));
      setIsEditorEmpty((editableRef.current?.textContent ?? '').trim().length === 0);
    }
    selectMedia(null);
  };

  const startMediaResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = selectedMediaRef.current;
    if (!element) {
      return;
    }
    event.preventDefault();
    resizeStateRef.current = { startX: event.clientX, startWidth: element.getBoundingClientRect().width, el: element };

    const onMove = (moveEvent: PointerEvent) => {
      const state = resizeStateRef.current;
      if (!state) {
        return;
      }
      const delta = moveEvent.clientX - state.startX;
      const nextWidth = Math.max(40, state.startWidth + delta);
      state.el.style.width = `${Math.round(nextWidth)}px`;
      state.el.style.height = 'auto';
      updateMediaBox(state.el);
    };

    const onUp = () => {
      resizeStateRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      isInternalChangeRef.current = true;
      setDoc((current) => ({ ...current }));
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const TABLE_RESIZE_THRESHOLD = 6;
  const TABLE_CORNER_THRESHOLD = 12;

  const ensureTableColumns = (table: HTMLTableElement): HTMLElement[] => {
    let colgroup = table.querySelector('colgroup');
    const columnCount = table.rows[0]?.cells.length ?? 0;
    if (!colgroup) {
      colgroup = document.createElement('colgroup');
      for (let i = 0; i < columnCount; i += 1) {
        colgroup.appendChild(document.createElement('col'));
      }
      table.insertBefore(colgroup, table.firstChild);
    }
    const cols = Array.from(colgroup.children) as HTMLElement[];
    const firstRow = table.rows[0];
    cols.forEach((col, index) => {
      const cell = firstRow?.cells[index];
      if (cell) {
        col.style.width = `${cell.offsetWidth}px`;
      }
    });
    table.style.tableLayout = 'fixed';
    return cols;
  };

  const detectTableResizeTarget = (
    event: { clientX: number; clientY: number; target: EventTarget | null }
  ): 'col' | 'row' | 'table' | null => {
    const targetEl = event.target as HTMLElement | null;
    const table = targetEl?.closest('table[data-rze-table-id]') as HTMLTableElement | null;
    if (!table) {
      return null;
    }
    const tableRect = table.getBoundingClientRect();
    if (
      Math.abs(event.clientX - tableRect.right) <= TABLE_CORNER_THRESHOLD &&
      Math.abs(event.clientY - tableRect.bottom) <= TABLE_CORNER_THRESHOLD
    ) {
      return 'table';
    }
    const cell = targetEl?.closest('td,th') as HTMLTableCellElement | null;
    if (!cell) {
      return null;
    }
    const cellRect = cell.getBoundingClientRect();
    if (Math.abs(event.clientX - cellRect.right) <= TABLE_RESIZE_THRESHOLD) {
      return 'col';
    }
    if (Math.abs(event.clientY - cellRect.bottom) <= TABLE_RESIZE_THRESHOLD) {
      return 'row';
    }
    return null;
  };

  const handleTableHoverMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (tableResizeRef.current) {
      return;
    }
    const editable = editableRef.current;
    if (!editable) {
      return;
    }
    const kind = detectTableResizeTarget(event);
    editable.style.cursor = kind === 'col' ? 'col-resize' : kind === 'row' ? 'row-resize' : kind === 'table' ? 'nwse-resize' : '';
  };

  const handleTablePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (event.button !== 0) {
      return;
    }
    const kind = detectTableResizeTarget(event);
    if (!kind) {
      return;
    }
    const targetEl = event.target as HTMLElement;
    const table = targetEl.closest('table[data-rze-table-id]') as HTMLTableElement | null;
    if (!table) {
      return;
    }
    event.preventDefault();

    if (kind === 'table') {
      const cols = ensureTableColumns(table);
      tableResizeRef.current = {
        type: 'table',
        table,
        startX: event.clientX,
        startY: event.clientY,
        cols,
        startColWidths: cols.map((col) => parseFloat(col.style.width) || 0),
        startTableWidth: table.offsetWidth
      };
    } else if (kind === 'col') {
      const cell = targetEl.closest('td,th') as HTMLTableCellElement;
      const cols = ensureTableColumns(table);
      table.style.width = `${table.offsetWidth}px`;
      tableResizeRef.current = {
        type: 'col',
        table,
        startX: event.clientX,
        startY: event.clientY,
        cols,
        colIndex: cell.cellIndex,
        startColWidths: cols.map((col) => parseFloat(col.style.width) || 0)
      };
    } else {
      const cell = targetEl.closest('td,th') as HTMLTableCellElement;
      const row = cell.parentElement as HTMLTableRowElement;
      tableResizeRef.current = {
        type: 'row',
        table,
        startX: event.clientX,
        startY: event.clientY,
        row,
        startRowHeight: row.offsetHeight
      };
    }

    const onMove = (moveEvent: PointerEvent) => {
      const state = tableResizeRef.current;
      if (!state) {
        return;
      }
      if (state.type === 'col' && state.cols && state.startColWidths && state.colIndex !== undefined) {
        const delta = moveEvent.clientX - state.startX;
        const index = state.colIndex;
        const nextCol = state.cols[index + 1];
        const newWidth = Math.max(40, state.startColWidths[index] + delta);
        state.cols[index].style.width = `${Math.round(newWidth)}px`;
        if (nextCol) {
          const nextWidth = Math.max(40, state.startColWidths[index + 1] - delta);
          nextCol.style.width = `${Math.round(nextWidth)}px`;
        } else {
          const total = state.cols.reduce((sum, col) => sum + (parseFloat(col.style.width) || 0), 0);
          state.table.style.width = `${Math.round(total)}px`;
        }
      } else if (state.type === 'row' && state.row && state.startRowHeight !== undefined) {
        const delta = moveEvent.clientY - state.startY;
        state.row.style.height = `${Math.max(24, Math.round(state.startRowHeight + delta))}px`;
      } else if (state.type === 'table' && state.cols && state.startColWidths && state.startTableWidth) {
        const delta = moveEvent.clientX - state.startX;
        const scale = Math.max(0.2, (state.startTableWidth + delta) / state.startTableWidth);
        let total = 0;
        state.cols.forEach((col, index) => {
          const width = Math.max(40, Math.round(state.startColWidths![index] * scale));
          col.style.width = `${width}px`;
          total += width;
        });
        state.table.style.width = `${total}px`;
      }
    };

    const onUp = () => {
      tableResizeRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (editableRef.current) {
        editableRef.current.style.cursor = '';
      }
      isInternalChangeRef.current = true;
      setDoc((current) => ({ ...current }));
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const commandContext: ToolbarCommandContext = {
    runCommand,
    getDocument: () => doc,
    setDocument: (nextDocument) => {
      setDoc(nextDocument);
      onChange?.(nextDocument);
    }
  };

  const applyInput: React.FormEventHandler<HTMLDivElement> = (event) => {
    const nextText = event.currentTarget.textContent ?? '';
    isInternalChangeRef.current = true;
    const nextDoc = mergeDocuments(doc, nextText);
    setDoc(nextDoc);
    onChange?.(nextDoc);

    setIsEditorEmpty(nextText.trim().length === 0);
  };

  const builtInRegistry: Record<BuiltInToolbarId, ToolbarFeatureDefinition> = {
    undo: { id: 'undo', icon: Undo2, tooltip: 'Undo', command: ({ runCommand: run }) => run('undo'), section: 'editing', row: 'primary' },
    redo: { id: 'redo', icon: Redo2, tooltip: 'Redo', command: ({ runCommand: run }) => run('redo'), section: 'editing', row: 'primary' },
    bold: { id: 'bold', icon: Bold, tooltip: 'Bold', command: ({ runCommand: run }) => run('bold'), shortcut: 'Ctrl+B', section: 'formatting', row: 'primary' },
    italic: { id: 'italic', icon: Italic, tooltip: 'Italic', command: ({ runCommand: run }) => run('italic'), shortcut: 'Ctrl+I', section: 'formatting', row: 'primary' },
    underline: { id: 'underline', icon: Underline, tooltip: 'Underline', command: ({ runCommand: run }) => run('underline'), shortcut: 'Ctrl+U', section: 'formatting', row: 'primary' },
    strike: { id: 'strike', icon: Strikethrough, tooltip: 'Strikethrough', command: ({ runCommand: run }) => run('strikeThrough'), section: 'formatting', row: 'primary' },
    fontFamily: {
      id: 'fontFamily',
      icon: Type,
      tooltip: 'Font Family',
      command: () => {
        const nextFamily = window.prompt('Enter font family (e.g. Georgia, Arial, monospace)', fontFamily);
        if (nextFamily && nextFamily.trim()) {
          const family = nextFamily.trim();
          setFontFamily(family);
          applyInlineStyleToSelection('fontFamily', family);
        }
      },
      section: 'formatting',
      row: 'primary'
    },
    fontSize: {
      id: 'fontSize',
      icon: Type,
      tooltip: 'Font Size',
      command: () => {},
      section: 'formatting',
      row: 'primary'
    },
    textColor: { id: 'textColor', icon: Palette, tooltip: 'Text Color', command: () => openColorPicker('foreColor'), section: 'formatting', row: 'primary' },
    highlight: { id: 'highlight', icon: Highlighter, tooltip: 'Highlight', command: () => openColorPicker('hiliteColor'), section: 'formatting', row: 'primary' },
    alignLeft: { id: 'alignLeft', icon: AlignLeft, tooltip: 'Align Left', command: ({ runCommand: run }) => run('justifyLeft'), section: 'layout', row: 'primary' },
    alignCenter: { id: 'alignCenter', icon: AlignCenter, tooltip: 'Align Center', command: ({ runCommand: run }) => run('justifyCenter'), section: 'layout', row: 'primary' },
    alignRight: { id: 'alignRight', icon: AlignRight, tooltip: 'Align Right', command: ({ runCommand: run }) => run('justifyRight'), section: 'layout', row: 'primary' },
    justify: { id: 'justify', icon: AlignJustify, tooltip: 'Justify', command: ({ runCommand: run }) => run('justifyFull'), section: 'layout', row: 'primary' },
    orderedList: { id: 'orderedList', icon: ListOrdered, tooltip: 'Ordered List', command: ({ runCommand: run }) => run('insertOrderedList'), section: 'lists', row: 'primary' },
    bulletList: { id: 'bulletList', icon: List, tooltip: 'Bullet List', command: ({ runCommand: run }) => run('insertUnorderedList'), section: 'lists', row: 'primary' },
    checkList: { id: 'checkList', icon: ListChecks, tooltip: 'Checklist', command: () => insertCheckListAtCursor(), section: 'lists', row: 'primary' },
    link: {
      id: 'link',
      icon: Link2,
      tooltip: 'Insert Link',
      command: () => openLinkDialog(),
      section: 'insert',
      row: 'secondary'
    },
    image: {
      id: 'image',
      icon: Image,
      tooltip: 'Insert Image',
      command: () => openInsertPrompt('image'),
      section: 'insert',
      row: 'secondary'
    },
    video: {
      id: 'video',
      icon: Video,
      tooltip: 'Insert Video Embed',
      command: () => openInsertPrompt('video'),
      section: 'insert',
      row: 'secondary'
    },
    uploadImage: {
      id: 'uploadImage',
      icon: ImagePlus,
      tooltip: 'Upload Image',
      command: () => triggerImageUpload(),
      section: 'insert',
      row: 'secondary'
    },
    uploadVideo: {
      id: 'uploadVideo',
      icon: FileVideo,
      tooltip: 'Upload Video',
      command: () => triggerVideoUpload(),
      section: 'insert',
      row: 'secondary'
    },
    table: {
      id: 'table',
      icon: Table,
      tooltip: 'Insert Table',
      command: () => insertTableAtCursor(3, 3),
      section: 'insert',
      row: 'secondary'
    },
    subscript: { id: 'subscript', icon: Subscript, tooltip: 'Subscript', command: ({ runCommand: run }) => run('subscript'), section: 'formatting', row: 'secondary' },
    superscript: { id: 'superscript', icon: Superscript, tooltip: 'Superscript', command: ({ runCommand: run }) => run('superscript'), section: 'formatting', row: 'secondary' },
    indent: { id: 'indent', icon: IndentIncrease, tooltip: 'Increase Indent', command: ({ runCommand: run }) => run('indent'), section: 'layout', row: 'secondary' },
    outdent: { id: 'outdent', icon: IndentDecrease, tooltip: 'Decrease Indent', command: ({ runCommand: run }) => run('outdent'), section: 'layout', row: 'secondary' },
    clearFormatting: { id: 'clearFormatting', icon: Eraser, tooltip: 'Clear Formatting', command: ({ runCommand: run }) => run('removeFormat'), section: 'review', row: 'secondary' },
    codeBlock: { id: 'codeBlock', icon: Code2, tooltip: 'Code Block', command: () => insertCodeBlockAtCursor(), section: 'developer', row: 'secondary' },
    print: { id: 'print', icon: Printer, tooltip: 'Print', command: () => window.print(), section: 'review', row: 'secondary' }
  };

  if (toolbarFeatures) {
    for (const feature of toolbarFeatures) {
      builtInRegistry[feature.id] = feature;
    }
  }

  const pluginItems = plugins.flatMap((plugin) => plugin.toolbar ?? []);
  const requestedItems = toolbar ?? DEFAULT_TOOLBAR;
  const resolvedItems: ToolbarItem[] = [...requestedItems, ...pluginItems];

  const filteredItems = resolvedItems.filter((item) => {
    if (typeof item === 'string') {
      const feature = builtInRegistry[item];
      if (!feature) {
        return false;
      }

      if (feature.visible === false || feature.enabled === false) {
        return false;
      }

      return !toolbarDisabledSections.includes(feature.section);
    }

    if (item.visible === false || item.enabled === false) {
      return false;
    }

    return !toolbarDisabledSections.includes(item.section ?? 'developer');
  });

  const visibleItems = filteredItems.filter((item) => {
    if (isToolbarExpanded) {
      return true;
    }

    if (typeof item === 'string') {
      return (builtInRegistry[item]?.row ?? 'primary') === 'primary';
    }

    return (item.row ?? 'primary') === 'primary';
  });

  const effectiveIconSize = iconSize ?? (toolbarSize === 'small' || toolbarSize === 'compact' ? 14 : toolbarSize === 'large' || toolbarSize === 'touch' ? 18 : 16);
  const effectiveButtonSize = buttonSize ?? (toolbarSize === 'small' || toolbarSize === 'compact' ? 28 : toolbarSize === 'large' || toolbarSize === 'touch' ? 36 : 32);

  const themeTokens: Record<ToolbarTheme, { toolbarBg: string; border: string; buttonBg: string; text: string; hover: string; active: string; focus: string }> = {
    light: { toolbarBg: '#efefef', border: '#cfd7e3', buttonBg: '#ffffff', text: '#1f2937', hover: '#f3f6fb', active: '#dce9ff', focus: '#2563eb' },
    dark: { toolbarBg: '#1f2937', border: '#334155', buttonBg: '#111827', text: '#e5e7eb', hover: '#374151', active: '#1d4ed8', focus: '#60a5fa' },
    minimal: { toolbarBg: '#f8fafc', border: '#e2e8f0', buttonBg: '#ffffff', text: '#0f172a', hover: '#f1f5f9', active: '#e2e8f0', focus: '#2563eb' },
    glass: { toolbarBg: 'rgba(255,255,255,0.55)', border: 'rgba(148,163,184,0.5)', buttonBg: 'rgba(255,255,255,0.75)', text: '#0f172a', hover: 'rgba(241,245,249,0.95)', active: 'rgba(191,219,254,0.95)', focus: '#2563eb' },
    material: { toolbarBg: '#eceff1', border: '#cfd8dc', buttonBg: '#ffffff', text: '#263238', hover: '#f5f7f8', active: '#d8e3f0', focus: '#1976d2' },
    bootstrap: { toolbarBg: '#f8f9fa', border: '#dee2e6', buttonBg: '#ffffff', text: '#212529', hover: '#e9ecef', active: '#cfe2ff', focus: '#0d6efd' },
    tailwind: { toolbarBg: '#f1f5f9', border: '#cbd5e1', buttonBg: '#ffffff', text: '#0f172a', hover: '#e2e8f0', active: '#bfdbfe', focus: '#2563eb' },
    corporate: { toolbarBg: '#eef2ff', border: '#c7d2fe', buttonBg: '#ffffff', text: '#1e293b', hover: '#e0e7ff', active: '#c7d2fe', focus: '#4f46e5' }
  };

  const theme = themeTokens[toolbarTheme];

  const toolbarBaseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: toolbarGap,
    background: theme.toolbarBg,
    border: toolbarVariant === 'outlined' ? `1px solid ${theme.border}` : 'none',
    borderBottom: `1px solid ${theme.border}`,
    padding: 8,
    position: toolbarSticky ? 'sticky' : 'relative',
    top: toolbarSticky ? 0 : undefined,
    zIndex: toolbarSticky ? 10 : 20,
    borderRadius: toolbarRounded ? 6 : 0,
    boxShadow: toolbarShadow ? '0 2px 6px rgba(15, 23, 42, 0.12)' : 'none',
    backdropFilter: toolbarTheme === 'glass' ? 'blur(8px)' : undefined,
    ...(toolbarPosition === 'floating'
      ? {
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          zIndex: 30,
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.18)'
        }
      : {}),
    ...(toolbarPosition === 'inline'
      ? {
          border: 'none',
          borderBottom: 'none',
          background: 'transparent',
          padding: 0,
          marginBottom: 8
        }
      : {})
  };

  const editorLayoutStyle: React.CSSProperties = {
    display: toolbarPosition === 'left' || toolbarPosition === 'right' ? 'flex' : 'block',
    flexDirection: toolbarPosition === 'right' ? 'row-reverse' : 'row'
  };

  const contentStyle: React.CSSProperties = {
    outline: 'none',
    minHeight: 280,
    background: '#ffffff',
    padding: 22,
    lineHeight: 1.55,
    color: '#1f2937',
    fontFamily: 'Segoe UI, Arial, sans-serif',
    flex: 1
  };

  const toolbarNode = (
    <div aria-label="Editor toolbar" role="toolbar" className="rze-toolbar rze-no-print" style={toolbarBaseStyle}>
      <input
        ref={imageFileInputRef}
        aria-label="Upload image file"
        type="file"
        accept={allowedImageTypes.join(',')}
        style={{ display: 'none' }}
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) {
            void handleUploadFiles(event.target.files, 'image');
          }
          event.target.value = '';
        }}
      />
      <input
        ref={videoFileInputRef}
        aria-label="Upload video file"
        type="file"
        accept={allowedVideoTypes.join(',')}
        style={{ display: 'none' }}
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) {
            void handleUploadFiles(event.target.files, 'video');
          }
          event.target.value = '';
        }}
      />

      <div style={{ flex: 1, overflowX: toolbarWrap ? 'auto' : 'hidden', overflowY: 'hidden' }}>
        <div
          data-testid="toolbar-controls"
          style={{
            display: 'flex',
            flexWrap: isToolbarExpanded && toolbarWrap ? 'wrap' : 'nowrap',
            gap: toolbarGap,
            rowGap: toolbarGap,
            alignItems: 'center',
            minWidth: toolbarWrap ? undefined : 'max-content'
          }}
        >
          {visibleItems.map((item, index) => {
            const previousItem = index > 0 ? visibleItems[index - 1] : undefined;
            const currentSection = typeof item === 'string' ? builtInRegistry[item]?.section : item.section ?? 'developer';
            const previousSection =
              typeof previousItem === 'string'
                ? previousItem
                  ? builtInRegistry[previousItem]?.section
                  : undefined
                : previousItem?.section ?? 'developer';
            const shouldShowDivider = showDividers && index > 0 && currentSection !== previousSection;

            const disabled = typeof item === 'string' ? builtInRegistry[item]?.enabled === false : item.enabled === false;
            const loading = typeof item === 'string' ? false : Boolean(item.loading);
            const shortcut = typeof item === 'string' ? builtInRegistry[item]?.shortcut : item.shortcut;
            const tooltip = typeof item === 'string' ? builtInRegistry[item]?.tooltip ?? item : item.tooltip;
            const label = shortcut ? `${tooltip} (${shortcut})` : tooltip;
            const handleClick = () => {
              if (loading || disabled) {
                return;
              }

              if (typeof item === 'string') {
                const feature = builtInRegistry[item];
                if (!feature) {
                  return;
                }

                feature.command(commandContext);
              } else {
                item.onClick(commandContext);
              }
            };

            const Icon = typeof item === 'string' ? builtInRegistry[item]?.icon : undefined;

            if (item === 'fontFamily') {
              const currentFamily = FONT_FAMILIES.find((font) => font.value === fontFamily);
              return (
                <React.Fragment key="fontFamily">
                  {shouldShowDivider ? <span aria-hidden="true" style={{ width: 1, height: effectiveButtonSize - 8, background: theme.border }} /> : null}
                  <ToolbarDropdown
                    ariaLabel="Font Family"
                    value={fontFamily}
                    displayLabel={currentFamily?.label ?? 'Default'}
                    options={FONT_FAMILIES.map((font) => ({
                      label: font.label,
                      value: font.value,
                      optionStyle: { fontFamily: font.value || undefined }
                    }))}
                    theme={theme}
                    height={effectiveButtonSize}
                    rounded={toolbarRounded}
                    buttonWidth={150}
                    menuWidth={190}
                    disabled={disabled}
                    showTooltips={showTooltips}
                    searchable
                    onOpen={saveEditorSelection}
                    onSelect={(nextValue) => {
                      setFontFamily(nextValue);
                      applyInlineStyleToSelection('fontFamily', nextValue || 'inherit');
                    }}
                  />
                </React.Fragment>
              );
            }

            if (item === 'fontSize') {
              return (
                <React.Fragment key="fontSize">
                  {shouldShowDivider ? <span aria-hidden="true" style={{ width: 1, height: effectiveButtonSize - 8, background: theme.border }} /> : null}
                  <FontSizeControl
                    value={fontSize}
                    theme={theme}
                    height={effectiveButtonSize}
                    rounded={toolbarRounded}
                    onOpen={saveEditorSelection}
                    onApply={(nextValue) => {
                      setFontSize(nextValue);
                      applyInlineStyleToSelection('fontSize', nextValue);
                    }}
                  />
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={typeof item === 'string' ? item : item.id}>
                {shouldShowDivider ? <span aria-hidden="true" style={{ width: 1, height: effectiveButtonSize - 8, background: theme.border }} /> : null}
                <button
                  type="button"
                  aria-label={tooltip}
                  title={showTooltips ? label : undefined}
                  disabled={disabled || loading}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setPopoverAnchor({ top: rect.bottom + 4, left: rect.left });
                    handleClick();
                  }}
                  style={{
                    width: effectiveButtonSize,
                    height: effectiveButtonSize,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: toolbarRounded ? 4 : 0,
                    border: `1px solid ${theme.border}`,
                    background: theme.buttonBg,
                    color: theme.text,
                    cursor: disabled || loading ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(event) => {
                    if (!disabled) {
                      event.currentTarget.style.background = theme.hover;
                    }
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = theme.buttonBg;
                  }}
                  onFocus={(event) => {
                    event.currentTarget.style.outline = `2px solid ${theme.focus}`;
                    event.currentTarget.style.outlineOffset = '1px';
                  }}
                  onBlur={(event) => {
                    event.currentTarget.style.outline = 'none';
                  }}
                >
                  {loading ? '...' : Icon ? <Icon size={effectiveIconSize} /> : item.icon}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        aria-label={isToolbarExpanded ? 'Collapse toolbar row' : 'Expand toolbar row'}
        title={showTooltips ? (isToolbarExpanded ? 'Collapse toolbar row' : 'Expand toolbar row') : undefined}
        onClick={() => setIsToolbarExpanded((previous) => !previous)}
        style={{
          width: effectiveButtonSize,
          height: effectiveButtonSize,
          borderRadius: toolbarRounded ? 4 : 0,
          border: `1px solid ${theme.border}`,
          background: theme.buttonBg,
          color: theme.text,
          cursor: 'pointer'
        }}
      >
        {isToolbarExpanded ? '▲' : '▼'}
      </button>

      {insertPrompt
        ? createPortal(
            <div
              role="dialog"
              aria-label={insertPrompt.type === 'image' ? 'Insert image' : 'Insert video embed'}
              className="rze-no-print"
              style={{
                position: 'fixed',
                top: popoverAnchor?.top ?? 80,
                left: popoverAnchor?.left ?? 16,
                zIndex: 2147483000,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: 8,
                background: theme.buttonBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 6,
                boxShadow: '0 6px 18px rgba(15, 23, 42, 0.18)'
              }}
            >
          <input
            ref={insertInputRef}
            type="url"
            aria-label={insertPrompt.type === 'image' ? 'Image URL' : 'Video URL'}
            placeholder={
              insertPrompt.type === 'image' ? 'https://example.com/image.png' : 'https://example.com/video.mp4'
            }
            value={insertValue}
            onChange={(event) => setInsertValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                confirmInsertPrompt();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                closeInsertPrompt();
              }
            }}
            style={{
              width: 240,
              height: effectiveButtonSize,
              padding: '0 8px',
              border: `1px solid ${theme.border}`,
              borderRadius: 4,
              background: '#ffffff',
              color: '#1f2937',
              fontSize: 13
            }}
          />
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={confirmInsertPrompt}
            style={{
              height: effectiveButtonSize,
              padding: '0 12px',
              borderRadius: 4,
              border: 'none',
              background: theme.focus,
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            Insert
          </button>
          <button
            type="button"
            aria-label="Cancel insert"
            onMouseDown={(event) => event.preventDefault()}
            onClick={closeInsertPrompt}
            style={{
              height: effectiveButtonSize,
              padding: '0 10px',
              borderRadius: 4,
              border: `1px solid ${theme.border}`,
              background: theme.buttonBg,
              color: theme.text,
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            Cancel
          </button>
        </div>,
            document.body
          )
        : null}

      {linkDialog
        ? createPortal(
            <div
              role="dialog"
              aria-label={linkDialog.editing ? 'Edit link' : 'Insert link'}
              className="rze-no-print"
              style={{
                position: 'fixed',
                top: popoverAnchor?.top ?? 80,
                left: popoverAnchor?.left ?? 16,
                zIndex: 2147483000,
                width: 300,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 12,
                background: theme.buttonBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                boxShadow: '0 6px 18px rgba(15, 23, 42, 0.18)'
              }}
            >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: theme.text }}>
            Display Text
            <input
              ref={linkTextInputRef}
              type="text"
              aria-label="Link display text"
              placeholder="Link text"
              value={linkDialog.text}
              onChange={(event) => setLinkDialog((prev) => (prev ? { ...prev, text: event.target.value } : prev))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  confirmLinkDialog();
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  closeLinkDialog();
                }
              }}
              style={{ height: effectiveButtonSize, padding: '0 8px', border: `1px solid ${theme.border}`, borderRadius: 4, background: '#ffffff', color: '#1f2937', fontSize: 13 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: theme.text }}>
            URL
            <input
              type="url"
              aria-label="Link URL"
              placeholder="https://example.com"
              value={linkDialog.url}
              onChange={(event) => setLinkDialog((prev) => (prev ? { ...prev, url: event.target.value } : prev))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  confirmLinkDialog();
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  closeLinkDialog();
                }
              }}
              style={{ height: effectiveButtonSize, padding: '0 8px', border: `1px solid ${theme.border}`, borderRadius: 4, background: '#ffffff', color: '#1f2937', fontSize: 13 }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: theme.text, cursor: 'pointer' }}>
            <input
              type="checkbox"
              aria-label="Open in new tab"
              checked={linkDialog.newTab}
              onChange={(event) => setLinkDialog((prev) => (prev ? { ...prev, newTab: event.target.checked } : prev))}
            />
            Open in new tab
          </label>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            {linkDialog.editing ? (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={removeLink}
                style={{ height: effectiveButtonSize, padding: '0 10px', borderRadius: 4, border: `1px solid ${theme.border}`, background: theme.buttonBg, color: '#dc2626', cursor: 'pointer', fontSize: 13, marginRight: 'auto' }}
              >
                Remove
              </button>
            ) : null}
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={closeLinkDialog}
              style={{ height: effectiveButtonSize, padding: '0 10px', borderRadius: 4, border: `1px solid ${theme.border}`, background: theme.buttonBg, color: theme.text, cursor: 'pointer', fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={confirmLinkDialog}
              style={{ height: effectiveButtonSize, padding: '0 12px', borderRadius: 4, border: 'none', background: theme.focus, color: '#ffffff', cursor: 'pointer', fontSize: 13 }}
            >
              {linkDialog.editing ? 'Update' : 'Insert'}
            </button>
          </div>
        </div>,
            document.body
          )
        : null}

      {colorPicker
        ? createPortal(
            <ColorPopover
              kind={colorPicker.kind}
              anchor={popoverAnchor}
              theme={theme}
              onSelect={(color) => applyColor(colorPicker.kind, color)}
              onClose={() => setColorPicker(null)}
            />,
            document.body
          )
        : null}
    </div>
  );

  const canvasNode = (
    <div ref={canvasWrapperRef} style={{ position: 'relative' }}>
      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        className="rze-content"
        onInput={applyInput}
        onClick={handleEditorClick}
        onPointerDown={handleTablePointerDown}
        onPointerMove={handleTableHoverMove}
        onDrop={handleEditorDrop}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isDragging) {
            setIsDragging(true);
          }
        }}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) {
            setIsDragging(false);
          }
        }}
        onFocus={() => {
          if (!isSelectionInsideEditor()) {
            placeCaretAtEnd();
          }
        }}
        onKeyDown={(event) => {
          if (handleCodeBlockKeyDown(event)) {
            return;
          }

          if (handleChecklistKeyDown(event)) {
            return;
          }

          if (event.key !== 'Tab') {
            return;
          }

          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) {
            return;
          }

          const node = selection.getRangeAt(0).startContainer;
          const cell = (node instanceof Element ? node : node.parentElement)?.closest('td');
          if (!cell) {
            return;
          }

          event.preventDefault();

          const row = cell.parentElement;
          const table = row?.closest('table');
          if (!row || !table) {
            return;
          }

          const cells = Array.from(table.querySelectorAll('td'));
          const currentIndex = cells.indexOf(cell);
          if (currentIndex === -1) {
            return;
          }

          const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
          const nextCell = cells[nextIndex] ?? cells[event.shiftKey ? cells.length - 1 : 0];
          focusInsideElementStart(nextCell);
        }}
        style={contentStyle}
      >
      </div>
      {isEditorEmpty ? <p style={{ margin: 0, padding: '0 22px 18px', color: '#7a7f87', fontSize: 13 }}>{placeholder}</p> : null}

      {isDragging ? (
        <div
          className="rze-no-print"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            pointerEvents: 'none',
            background: 'rgba(214, 143, 90, 0.12)',
            border: '2px dashed #d68f5a',
            borderRadius: 6,
            color: '#b45309',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          <Upload size={18} />
          Drop image or video to upload
        </div>
      ) : null}

      {uploadState ? (
        <div
          role="status"
          aria-label="Upload progress"
          className="rze-no-print"
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: 12,
            background: '#ffffff',
            border: '1px solid #d0d7de',
            borderRadius: 8,
            boxShadow: '0 6px 18px rgba(15, 23, 42, 0.18)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
              Uploading {uploadState.name}
            </span>
            <span>{uploadState.progress}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${uploadState.progress}%`, background: '#d68f5a', transition: 'width 0.2s ease' }} />
          </div>
        </div>
      ) : null}

      {uploadError ? (
        <div
          role="alert"
          className="rze-no-print"
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '10px 12px',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 8,
            color: '#b91c1c',
            fontSize: 13
          }}
        >
          <span>{uploadError}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setUploadError(null)}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: '#b91c1c', cursor: 'pointer', padding: 2 }}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {mediaBox ? (
        <div
          className="rze-no-print"
          style={{
            position: 'absolute',
            top: mediaBox.top,
            left: mediaBox.left,
            width: mediaBox.width,
            height: mediaBox.height,
            zIndex: 20,
            pointerEvents: 'none',
            border: '2px solid #d68f5a',
            borderRadius: 4,
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -40,
              left: 0,
              display: 'flex',
              gap: 4,
              padding: 4,
              background: '#1f2937',
              borderRadius: 6,
              pointerEvents: 'auto',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
            }}
          >
            <button type="button" aria-label="Align left" title="Align left" onMouseDown={(e) => e.preventDefault()} onClick={() => alignSelectedMedia('left')} style={mediaOverlayButtonStyle}>
              <AlignLeft size={14} />
            </button>
            <button type="button" aria-label="Align center" title="Align center" onMouseDown={(e) => e.preventDefault()} onClick={() => alignSelectedMedia('center')} style={mediaOverlayButtonStyle}>
              <AlignCenter size={14} />
            </button>
            <button type="button" aria-label="Align right" title="Align right" onMouseDown={(e) => e.preventDefault()} onClick={() => alignSelectedMedia('right')} style={mediaOverlayButtonStyle}>
              <AlignRight size={14} />
            </button>
            <span style={{ width: 1, background: '#4b5563', margin: '2px 2px' }} />
            <button type="button" aria-label="Resize to 25%" title="25%" onMouseDown={(e) => e.preventDefault()} onClick={() => resizeSelectedMedia(25)} style={mediaOverlayTextButtonStyle}>25%</button>
            <button type="button" aria-label="Resize to 50%" title="50%" onMouseDown={(e) => e.preventDefault()} onClick={() => resizeSelectedMedia(50)} style={mediaOverlayTextButtonStyle}>50%</button>
            <button type="button" aria-label="Resize to 100%" title="100%" onMouseDown={(e) => e.preventDefault()} onClick={() => resizeSelectedMedia(100)} style={mediaOverlayTextButtonStyle}>100%</button>
            <span style={{ width: 1, background: '#4b5563', margin: '2px 2px' }} />
            <button type="button" aria-label="Remove media" title="Remove" onMouseDown={(e) => e.preventDefault()} onClick={removeSelectedMedia} style={{ ...mediaOverlayButtonStyle, color: '#fca5a5' }}>
              <Trash2 size={14} />
            </button>
          </div>
          <div
            role="presentation"
            onPointerDown={startMediaResize}
            style={{
              position: 'absolute',
              right: -6,
              bottom: -6,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#d68f5a',
              border: '2px solid #ffffff',
              cursor: 'nwse-resize',
              pointerEvents: 'auto'
            }}
          />
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      className="rze-editor-root"
      style={{
        border: '1px solid #d0d7de',
        borderRadius: 8,
        minHeight: 120,
        background: '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
      }}
    >
      <style>{RZE_PRINT_STYLES}</style>
      <div className="rze-no-print" style={{ height: 8, background: '#ffffff' }} />
      <div style={editorLayoutStyle}>
        {toolbarPosition === 'bottom' ? null : toolbarNode}
        {canvasNode}
        {toolbarPosition === 'bottom' ? toolbarNode : null}
      </div>
    </div>
  );
}
