import React, { useState, useRef } from 'react';

export default function TagInput({ tags = [], allTags = [], onChange }) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);

  const handleInput = (val) => {
    setInput(val);
    if (val.trim()) {
      const lower = val.toLowerCase();
      const sugg = allTags.filter(t =>
        t.name.toLowerCase().includes(lower) && !tags.includes(t.name)
      );
      setSuggestions(sugg);
    } else {
      setSuggestions([]);
    }
  };

  const addTag = (name) => {
    const trimmed = name.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setInput('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const removeTag = (name) => {
    onChange(tags.filter(t => t !== name));
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
        background: 'var(--card)',
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '6px 10px',
        minHeight: 38,
        cursor: 'text'
      }} onClick={() => inputRef.current?.focus()}>
        {tags.map(tag => (
          <span key={tag} className="tag-pill" style={{ gap: 4 }}>
            {tag}
            <button
              onClick={e => { e.stopPropagation(); removeTag(tag); }}
              style={{ fontSize: 12, color: 'var(--sage-mid)', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Add tags…' : ''}
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: 13,
            color: 'var(--text-dark)',
            minWidth: 80,
            flex: 1,
            padding: 0,
            width: 'auto'
          }}
        />
      </div>

      {suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--card)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          zIndex: 20,
          marginTop: 2,
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden'
        }}>
          {suggestions.map(t => (
            <button
              key={t.id}
              onMouseDown={e => { e.preventDefault(); addTag(t.name); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: 13,
                color: 'var(--text-mid)',
                borderRadius: 0,
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--sage-pale)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
