'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme?: any;
  language?: 'en' | 'bg';
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  theme,
  language = 'en'
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      Underline,
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[200px] p-4',
        style: `color: ${theme?.colors?.text || '#000'}; background-color: ${theme?.colors?.background || '#fff'};`,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  if (!mounted) {
    return (
      <div 
        className="h-48 border rounded-md p-4 animate-pulse"
        style={{
          backgroundColor: theme?.colors?.background || '#fff',
          borderColor: theme?.colors?.border || '#e5e7eb',
        }}
      />
    );
  }

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="mb-4">
      {/* Toolbar */}
      <div 
        className="border rounded-t-md p-2 flex flex-wrap gap-2 items-center"
        style={{
          backgroundColor: theme?.colors?.background || '#fff',
          borderColor: theme?.colors?.border || '#e5e7eb',
        }}
      >
        {/* Text Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            editor.isActive('bold') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: editor.isActive('bold') ? theme?.colors?.primary : 'transparent',
            color: editor.isActive('bold') ? '#fff' : theme?.colors?.text,
          }}
          type="button"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            editor.isActive('italic') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: editor.isActive('italic') ? theme?.colors?.primary : 'transparent',
            color: editor.isActive('italic') ? '#fff' : theme?.colors?.text,
          }}
          type="button"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            editor.isActive('underline') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: editor.isActive('underline') ? theme?.colors?.primary : 'transparent',
            color: editor.isActive('underline') ? '#fff' : theme?.colors?.text,
          }}
          type="button"
        >
          <u>U</u>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: editor.isActive('heading', { level: 1 }) ? theme?.colors?.primary : 'transparent',
            color: editor.isActive('heading', { level: 1 }) ? '#fff' : theme?.colors?.text,
          }}
          type="button"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: editor.isActive('heading', { level: 2 }) ? theme?.colors?.primary : 'transparent',
            color: editor.isActive('heading', { level: 2 }) ? '#fff' : theme?.colors?.text,
          }}
          type="button"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: editor.isActive('heading', { level: 3 }) ? theme?.colors?.primary : 'transparent',
            color: editor.isActive('heading', { level: 3 }) ? '#fff' : theme?.colors?.text,
          }}
          type="button"
        >
          H3
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: editor.isActive('bulletList') ? theme?.colors?.primary : 'transparent',
            color: editor.isActive('bulletList') ? '#fff' : theme?.colors?.text,
          }}
          type="button"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            editor.isActive('orderedList') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: editor.isActive('orderedList') ? theme?.colors?.primary : 'transparent',
            color: editor.isActive('orderedList') ? '#fff' : theme?.colors?.text,
          }}
          type="button"
        >
          1.
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Link */}
        <button
          onClick={setLink}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            editor.isActive('link') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: editor.isActive('link') ? theme?.colors?.primary : 'transparent',
            color: editor.isActive('link') ? '#fff' : theme?.colors?.text,
          }}
          type="button"
        >
          🔗
        </button>

        {/* Text Align */}
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: editor.isActive({ textAlign: 'left' }) ? theme?.colors?.primary : 'transparent',
            color: editor.isActive({ textAlign: 'left' }) ? '#fff' : theme?.colors?.text,
          }}
          type="button"
        >
          ←
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: editor.isActive({ textAlign: 'center' }) ? theme?.colors?.primary : 'transparent',
            color: editor.isActive({ textAlign: 'center' }) ? '#fff' : theme?.colors?.text,
          }}
          type="button"
        >
          ⬌
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: editor.isActive({ textAlign: 'right' }) ? theme?.colors?.primary : 'transparent',
            color: editor.isActive({ textAlign: 'right' }) ? '#fff' : theme?.colors?.text,
          }}
          type="button"
        >
          →
        </button>
      </div>

      {/* Editor Content */}
      <div
        className="border border-t-0 rounded-b-md overflow-auto"
        style={{
          backgroundColor: theme?.colors?.background || '#fff',
          borderColor: theme?.colors?.border || '#e5e7eb',
          minHeight: '200px',
          maxHeight: '400px',
        }}
      >
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .ProseMirror {
          outline: none;
          padding: 1rem;
          min-height: 200px;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3 {
          margin-top: 1em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        .ProseMirror a {
          color: ${theme?.colors?.primary || '#3b82f6'};
          text-decoration: underline;
        }
        .ProseMirror a:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
