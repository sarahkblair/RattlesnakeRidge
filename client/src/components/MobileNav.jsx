import React from 'react';

const SECTIONS = [
  { id: 'vocabulary', label: 'Vocab', icon: '📖' },
  { id: 'deep-dives', label: 'Deep Dives', icon: '🔭' },
  { id: 'wisdom', label: 'Wisdom', icon: '✦' },
  { id: 'books', label: 'Books', icon: '📚' },
  { id: 'podcasts', label: 'Podcasts', icon: '🎙' },
];

export default function MobileNav({ activeSection, onSelect }) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--sidebar)',
      borderTop: '1.5px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '6px 0 10px',
      zIndex: 50
    }}>
      {SECTIONS.map(s => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            fontSize: 11,
            color: activeSection === s.id ? 'var(--clay)' : 'var(--text-light)',
            fontWeight: activeSection === s.id ? 700 : 400,
            padding: '4px 12px'
          }}
        >
          <span style={{ fontSize: 18 }}>{s.icon}</span>
          {s.label}
        </button>
      ))}
    </nav>
  );
}
