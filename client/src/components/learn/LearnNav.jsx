import React from 'react';

const LEARN = [
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'deep-dives', label: 'Deep Dives' },
  { id: 'wisdom', label: 'Wisdom' },
  { id: 'business', label: 'Business' },
  { id: 'psychology', label: 'Psychology' },
];
const MEDIA = [
  { id: 'books', label: 'Books' },
  { id: 'podcasts', label: 'Podcasts' },
  { id: 'videos', label: 'Videos' },
  { id: 'articles', label: 'Articles' },
  { id: 'documentaries', label: 'Documentaries' },
];

function NavRow({ label, items, activeSection, activeTag, onSelect, type }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', padding: '0 14px', minHeight: 38, background: 'var(--panel)', gap: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-light)', minWidth: 56, flexShrink: 0, paddingRight: 10 }}>{label}</div>
      <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0, marginRight: 10 }} />
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flex: 1, padding: '5px 0', scrollbarWidth: 'none' }}>
        {items.map(item => {
          const isActive = type === 'tag'
            ? activeTag && activeTag.id === item.id
            : activeSection === item.id && !activeTag;
          return (
            <button
              key={item.id || item.name}
              className={`nav-pill${isActive ? (type === 'tag' ? ' active-sage' : ' active') : ''}`}
              onClick={() => type === 'tag' ? onSelect('tag', item) : onSelect(item.id, null)}
            >
              {item.label || item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function LearnNav({ activeSection, activeTag, tags, onSelect, isMobile }) {
  if (isMobile) {
    const all = [
      ...LEARN.map(s => ({ ...s, type: 'section' })),
      ...MEDIA.map(s => ({ ...s, type: 'section' })),
      ...tags.map(t => ({ ...t, label: t.name, type: 'tag' })),
    ];
    return (
      <div style={{ background: 'var(--panel)', borderBottom: '1.5px solid var(--border)', overflowX: 'auto', display: 'flex', gap: 4, padding: '7px 12px', scrollbarWidth: 'none' }}>
        {all.map(item => {
          const isActive = item.type === 'tag' ? activeTag?.id === item.id : activeSection === item.id && !activeTag;
          return (
            <button key={`${item.type}-${item.id}`} className={`nav-pill${isActive ? (item.type === 'tag' ? ' active-sage' : ' active') : ''}`} onClick={() => item.type === 'tag' ? onSelect('tag', item) : onSelect(item.id, null)}>
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <nav style={{ flexShrink: 0 }}>
      <NavRow label="Learn" items={LEARN} activeSection={activeSection} activeTag={activeTag} onSelect={onSelect} type="section" />
      <NavRow label="Media" items={MEDIA} activeSection={activeSection} activeTag={activeTag} onSelect={onSelect} type="section" />
      <NavRow label="Tags" items={tags} activeSection={activeSection} activeTag={activeTag} onSelect={onSelect} type="tag" />
    </nav>
  );
}
