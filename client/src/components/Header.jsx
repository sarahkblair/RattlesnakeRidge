import React, { useState, useRef } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function todayLabel() {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function Header({ onSearch, searchQuery, onNewEntry, onSettings, onFavorites, onQuickAdd, showingSettings }) {
  const inputRef = useRef(null);

  return (
    <header className="app-header">
      <div className="app-name">Sarah's Brain</div>

      <div style={{ flex: 1, maxWidth: 460, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: 15, pointerEvents: 'none' }}>⌕</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search everything, or ask naturally…"
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          style={{ paddingLeft: 30, borderRadius: 99, fontSize: 13, height: 32, width: '100%' }}
        />
        {searchQuery && (
          <button onClick={() => { onSearch(''); inputRef.current?.focus(); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: 16 }}>×</button>
        )}
      </div>

      <div className="desktop-only" style={{ fontSize: 12, color: 'var(--text-light)', whiteSpace: 'nowrap', flexShrink: 0 }}>{todayLabel()}</div>

      <button onClick={onFavorites} title="Favorites" style={{ fontSize: 18, color: 'var(--text-light)', padding: '4px 6px', flexShrink: 0 }}>★</button>

      {!showingSettings && (
        <>
          <button className="btn-primary desktop-only" onClick={onNewEntry} style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0 }}>+ New Entry</button>
          <button onClick={onQuickAdd} title="Quick add" style={{ fontSize: 20, color: 'var(--text-light)', padding: '2px 6px', flexShrink: 0 }}>+</button>
        </>
      )}

      <button onClick={onSettings} title={showingSettings ? 'Back' : 'Settings'} style={{ fontSize: 17, color: showingSettings ? 'var(--clay)' : 'var(--text-light)', padding: '4px 6px', flexShrink: 0 }}>
        {showingSettings ? '←' : '⚙'}
      </button>
    </header>
  );
}
