import React, { useRef } from 'react';

// Lightweight rich editor using contentEditable + execCommand
const TOOLBAR = [
  { cmd: 'bold', label: 'B', style: { fontWeight: 700 } },
  { cmd: 'italic', label: 'I', style: { fontStyle: 'italic' } },
  { cmd: 'underline', label: 'U', style: { textDecoration: 'underline' } },
  { cmd: 'insertUnorderedList', label: '•', style: {} },
  { cmd: 'insertOrderedList', label: '1.', style: {} },
  { cmd: 'formatBlock', label: 'H2', arg: 'h2', style: {} },
  { cmd: 'formatBlock', label: 'H3', arg: 'h3', style: {} },
];

export default function RichEditor({ value, onChange, placeholder = 'Start writing…', minHeight = 240 }) {
  const editorRef = useRef(null);

  const execCmd = (cmd, arg) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg || null);
    handleChange();
  };

  const handleChange = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: 2,
        padding: '6px 8px',
        background: 'var(--panel)',
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap'
      }}>
        {TOOLBAR.map(({ cmd, label, arg, style }) => (
          <button
            key={label}
            onMouseDown={e => { e.preventDefault(); execCmd(cmd, arg); }}
            style={{
              ...style,
              fontSize: 12,
              padding: '3px 8px',
              borderRadius: 4,
              color: 'var(--text-mid)',
              background: 'none',
              border: '1px solid transparent',
              cursor: 'pointer'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--sage-pale)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            {label}
          </button>
        ))}
        <label
          style={{
            fontSize: 12,
            padding: '3px 8px',
            borderRadius: 4,
            color: 'var(--text-mid)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center'
          }}
          title="Insert image"
        >
          🖼
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => {
                document.execCommand('insertImage', false, ev.target.result);
                handleChange();
              };
              reader.readAsDataURL(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleChange}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={value !== undefined && !editorRef.current ? { __html: value || '' } : undefined}
        data-placeholder={placeholder}
        style={{
          minHeight,
          padding: '14px 16px',
          fontFamily: 'var(--font-serif)',
          fontSize: 15,
          lineHeight: 1.75,
          color: 'var(--text-dark)',
          outline: 'none',
          background: 'var(--card)',
          overflowY: 'auto'
        }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--text-light);
          font-style: italic;
          pointer-events: none;
        }
        [contenteditable] h2 { font-size: 1.25rem; margin: 12px 0 6px; }
        [contenteditable] h3 { font-size: 1.05rem; margin: 10px 0 4px; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 24px; margin: 6px 0; }
        [contenteditable] li { margin: 2px 0; }
        [contenteditable] img { max-width: 100%; border-radius: 6px; margin: 8px 0; display: block; }
      `}</style>
    </div>
  );
}
