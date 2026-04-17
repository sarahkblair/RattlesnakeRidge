import React, { useRef } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function todayLabel() {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function TopBar({ onSearch, searchQuery = '', onNewEntry, onSettings, showingSettings }) {
  const inputRef = useRef(null);

  return (
    <header style={{
      background: 'var(--sidebar)',
      borderBottom: '1.5px solid var(--border)',
      padding: '0 20px',
      height: 58,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexShrink: 0,
      zIndex: 10
    }}>
      {/* App name */}
      <div style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--clay)',
        whiteSpace: 'nowrap',
        flexShrink: 0
      }}>
        Sarah's Brain
      </div>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-light)', fontSize: 14, pointerEvents: 'none'
        }}>
          ⌕
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search everything…"
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          style={{
            paddingLeft: 30,
            background: 'var(--card)',
            border: '1.5px solid var(--border)',
            borderRadius: 99,
            fontSize: 13,
            height: 34,
            width: '100%'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => { onSearch(''); inputRef.current?.focus(); }}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-light)', fontSize: 16, lineHeight: 1
            }}
          >×</button>
        )}
      </div>

      {/* Date */}
      <div className="desktop-only" style={{
        fontSize: 12,
        color: 'var(--text-light)',
        whiteSpace: 'nowrap',
        flexShrink: 0
      }}>
        {todayLabel()}
      </div>

      {/* New Entry button */}
      {!showingSettings && (
        <button className="btn-primary desktop-only" onClick={onNewEntry} style={{ flexShrink: 0, fontSize: 13 }}>
          + New Entry
        </button>
      )}

      {/* Settings gear */}
      <button
        onClick={onSettings}
        title={showingSettings ? 'Back' : 'Settings'}
        style={{
          flexShrink: 0,
          fontSize: 18,
          color: showingSettings ? 'var(--clay)' : 'var(--text-light)',
          padding: '4px 6px',
          borderRadius: 'var(--radius-sm)'
        }}
      >
        {showingSettings ? '←' : '⚙'}
      </button>
    </header>
  );
}
