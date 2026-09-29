import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link as TipTapLink } from '@tiptap/extension-link';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Placeholder } from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Code, Quote,
  Table as TableIcon, Minus, Link as LinkIcon,
  Undo, Redo, Eye, Save,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { MacosWindowHeader } from '../shared/MacosWindowHeader';

interface DocumentEditorProps {
  initialContent?: string;
  initialTitle?: string;
  onSave: (title: string, content: string) => Promise<void>;
  onCancel: () => void;
  onPreview?: (title: string, content: string) => void;
  saving?: boolean;
}

export function DocumentEditor({
  initialContent = '',
  initialTitle = '',
  onSave,
  onCancel,
  onPreview,
  saving = false,
}: DocumentEditorProps) {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
        underline: false,
      }),
      Underline,
      TipTapLink.configure({
        openOnClick: false,
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-surface-900 text-surface-100 rounded-lg p-4 font-mono text-sm',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({
        placeholder: 'Paste or type your document content here...',
      }),
    ],
    content: initialContent,
    parseOptions: {
      preserveWhitespace: 'full',
    },
    editorProps: {
      attributes: {
        class: 'document-prose focus:outline-none',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Tab') {
          event.preventDefault();
          view.dispatch(view.state.tr.insertText('    '));
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent && !editor.isDestroyed) {
      editor.commands.setContent(initialContent, {
        parseOptions: {
          preserveWhitespace: 'full',
        },
      });
    }
  }, [editor, initialContent]);

  const handleSave = useCallback(async () => {
    if (!editor || !title.trim()) return;
    const html = editor.getHTML();
    await onSave(title, html);
  }, [editor, title, onSave]);

  const handlePreview = useCallback(() => {
    if (!editor || !title.trim() || !onPreview) return;
    const html = editor.getHTML();
    onPreview(title, html);
  }, [editor, title, onPreview]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    children,
    title: buttonTitle,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
        active
          ? 'bg-[#E1F3E9] dark:bg-[#176B48]/30 text-[#176B48] dark:text-[#52C58F] shadow-xs'
          : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
      title={buttonTitle}
      aria-label={buttonTitle}
      aria-pressed={active}
    >
      {children}
    </button>
  );

  const ToolbarDivider = () => (
    <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-0.5" />
  );

  return (
    <div className="space-y-4">
      {/* Title input */}
      <div>
        <label htmlFor="doc-title" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
          Title
        </label>
        <input
          id="doc-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="macos-input text-lg font-medium"
          placeholder="e.g. Lecture Notes, Exam Review, or Guide"
          required
        />
      </div>

      {/* Editor */}
      <div>
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
          Content
        </label>
        <div className="macos-window overflow-hidden tiptap-editor">
          <MacosWindowHeader title="Document Editor" />
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Bold"
            >
              <Bold size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Italic"
            >
              <Italic size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
              title="Underline"
            >
              <UnderlineIcon size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
              title="Strikethrough"
            >
              <Strikethrough size={15} />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              <Heading1 size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive('heading', { level: 3 })}
              title="Heading 3"
            >
              <Heading3 size={15} />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <List size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              title="Numbered List"
            >
              <ListOrdered size={15} />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              active={editor.isActive('codeBlock')}
              title="Code Block"
            >
              <Code size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive('blockquote')}
              title="Blockquote"
            >
              <Quote size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={addLink}
              active={editor.isActive('link')}
              title="Add Link"
            >
              <LinkIcon size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={addTable}
              title="Insert Table"
            >
              <TableIcon size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Rule"
            >
              <Minus size={15} />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo size={15} />
            </ToolbarButton>
          </div>

          {/* Editor content */}
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onCancel}
          className="macos-btn-secondary"
          disabled={saving}
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          {onPreview && (
            <button
              onClick={handlePreview}
              className="macos-btn-secondary"
              disabled={saving || !title.trim()}
            >
              <Eye size={15} />
              <span>Preview</span>
            </button>
          )}
          <button
            onClick={handleSave}
            className="macos-btn-primary"
            disabled={saving || !title.trim()}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save size={15} />
                Save Document
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
