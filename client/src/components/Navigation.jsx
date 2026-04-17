import React, { useRef } from 'react';

const LEARN_SECTIONS = [
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'deep-dives', label: 'Deep Dives' },
  { id: 'wisdom', label: 'Wisdom' },
  { id: 'business', label: 'Business' },
  { id: 'psychology', label: 'Psychology' },
];

const MEDIA_SECTIONS = [
  { id: 'books', label: 'Books' },
  { id: 'podcasts', label: 'Podcasts' },
  { id: 'videos', label: 'Videos' },
  { id: 'articles', label: 'Articles' },
  { id: 'documentaries', label: 'Documentaries' },
];

function NavRow({ label, items, activeSection, activeTag, onSelect, type }) {
  const scrollRef = useRef(null);
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      padding: '0 16px',
      minHeight: 40,
      background: 'var(--panel)',
      gap: 0
    }}>
      <div style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-light)',
        minWidth: 68,
        flexShrink: 0,
        paddingRight: 12
      }}>
        {label}
      </div>
      <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0, marginRight: 12 }} />
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          flex: 1,
          padding: '6px 0',
          scrollbarWidth: 'none'
        }}
      >
        {items.map(item => {
          const isActive = type === 'tag'
            ? (activeTag && activeTag.id === item.id)
            : (activeSection === item.id && !activeTag);
          const sagePill = type === 'tag';
          return (
            <button
              key={item.id}
              className={`nav-pill${isActive ? (sagePill ? ' active-sage' : ' active') : ''}`}
              onClick={() => onSelect(type === 'tag' ? 'tag' : item.id, type === 'tag' ? item : null)}
              style={{ fontSize: 12 }}
            >
              {item.label || item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Navigation({ activeSection, activeTag, tags, onSelect, isMobile }) {
  if (isMobile) {
    // All pills in a single scrollable row
    const allItems = [
      ...LEARN_SECTIONS.map(s => ({ ...s, type: 'section' })),
      ...MEDIA_SECTIONS.map(s => ({ ...s, type: 'section' })),
      ...tags.map(t => ({ ...t, label: t.name, type: 'tag' }))
    ];
    return (
      <div style={{
        background: 'var(--panel)',
        borderBottom: '1.5px solid var(--border)',
        overflowX: 'auto',
        display: 'flex',
        gap: 4,
        padding: '8px 12px',
        scrollbarWidth: 'none'
      }}>
        {allItems.map(item => {
          const isActive = item.type === 'tag'
            ? (activeTag && activeTag.id === item.id)
            : (activeSection === item.id && !activeTag);
          return (
            <button
              key={`${item.type}-${item.id}`}
              className={`nav-pill${isActive ? (item.type === 'tag' ? ' active-sage' : ' active') : ''}`}
              onClick={() => {
                if (item.type === 'tag') onSelect('tag', item);
                else onSelect(item.id, null);
              }}
              style={{ fontSize: 12 }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <nav style={{ flexShrink: 0 }}>
      <NavRow
        label="Learn"
        items={LEARN_SECTIONS}
        activeSection={activeSection}
        activeTag={activeTag}
        onSelect={onSelect}
        type="section"
      />
      <NavRow
        label="Media"
        items={MEDIA_SECTIONS}
        activeSection={activeSection}
        activeTag={activeTag}
        onSelect={onSelect}
        type="section"
      />
      <NavRow
        label="Tags"
        items={tags}
        activeSection={activeSection}
        activeTag={activeTag}
        onSelect={onSelect}
        type="tag"
      />
    </nav>
  );
}
