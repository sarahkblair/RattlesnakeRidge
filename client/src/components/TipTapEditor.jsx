import React, { useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

const ToolbarBtn = ({ onClick, active, title, children }) => (
  <button
    onMouseDown={e => { e.preventDefault(); onClick(); }}
    className={active ? 'is-active' : ''}
    title={title}
  >
    {children}
  </button>
);

export default function TipTapEditor({ content, onChange, placeholder = 'Start writing…', minHeight = 180 }) {
  const fileRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => onChange && onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const insertImage = () => fileRef.current?.click();

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => editor.chain().focus().setImage({ src: ev.target.result }).run();
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="tiptap-wrapper">
      <div className="tiptap-toolbar">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><b>B</b></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><i>I</i></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2">H2</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3">H3</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">•</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">1.</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">"</ToolbarBtn>
        <ToolbarBtn onClick={insertImage} active={false} title="Image">🖼</ToolbarBtn>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
      <EditorContent editor={editor} style={{ minHeight }} />
    </div>
  );
}
