import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';

const SECTION_LABELS = {
  vocabulary: 'Vocabulary',
  'deep-dives': 'Deep Dives',
  wisdom: 'Wisdom',
  business: 'Business',
  psychology: 'Psychology',
  books: 'Books',
  podcasts: 'Podcasts',
  videos: 'Videos',
  articles: 'Articles',
  documentaries: 'Documentaries',
  tag: 'Tagged'
};

const MEDIA_SECTIONS = ['books', 'podcasts', 'videos', 'articles', 'documentaries'];

const STATUS_LABELS = {
  books: { consumed: 'read', total: 'read' },
  podcasts: { consumed: 'listened', total: 'listened' },
  videos: { consumed: 'watched', total: 'watched' },
  articles: { consumed: 'read', total: 'read' },
  documentaries: { consumed: 'watched', total: 'watched' }
};

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EntryList({ section, activeTag, selectedEntry, searchQuery, searchResults, onSelectEntry, onNewEntry }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFolders, setShowFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);

  const isMedia = MEDIA_SECTIONS.includes(section);
  const isPodcasts = section === 'podcasts';

  useEffect(() => {
    setStatusFilter('all');
    setSelectedFolder(null);
    load();
  }, [section, activeTag]);

  useEffect(() => {
    if (!searchQuery) load();
  }, [statusFilter, selectedFolder]);

  async function load() {
    setLoading(true);
    try {
      if (activeTag) {
        const data = await api.getEntriesByTag(activeTag.id);
        setEntries(data);
      } else if (isPodcasts && !selectedFolder) {
        const folders = await api.getShowFolders();
        setShowFolders(folders);
        setEntries([]);
      } else if (isPodcasts && selectedFolder) {
        const data = await api.getEntries({ section, show_folder_id: selectedFolder.id, status: statusFilter });
        setEntries(data);
      } else {
        const params = { section };
        if (statusFilter !== 'all') params.status = statusFilter;
        const data = await api.getEntries(params);
        setEntries(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const displayEntries = searchResults || entries;
  const consumed = displayEntries.filter(e => e.status === 'consumed').length;
  const total = displayEntries.length;

  const handleCreateFolder = async () => {
    const name = window.prompt('Podcast show name:');
    if (!name) return;
    await api.createShowFolder(name);
    const folders = await api.getShowFolders();
    setShowFolders(folders);
  };

  return (
    <aside style={{
      width: 260,
      minWidth: 220,
      maxWidth: 300,
      background: 'var(--panel)',
      borderRight: '1.5px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 style={{ fontSize: 14, color: 'var(--text-dark)' }}>
            {activeTag ? `#${activeTag.name}` : SECTION_LABELS[section] || section}
          </h3>
          {isMedia && !searchResults && (
            <span style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600 }}>
              {consumed}/{total} {STATUS_LABELS[section]?.consumed || 'done'}
            </span>
          )}
        </div>

        {/* Status filter for media */}
        {isMedia && !activeTag && !searchResults && (
          <div style={{ display: 'flex', gap: 4 }}>
            {['all', 'consumed', 'not-consumed'].map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                style={{
                  fontSize: 11,
                  padding: '2px 9px',
                  borderRadius: 99,
                  fontWeight: 600,
                  background: statusFilter === f ? 'var(--clay)' : 'transparent',
                  color: statusFilter === f ? '#fff' : 'var(--text-light)',
                  border: '1px solid',
                  borderColor: statusFilter === f ? 'var(--clay)' : 'var(--border)'
                }}
              >
                {f === 'all' ? 'All' : f === 'consumed' ? 'Read/Watched' : 'Not Yet'}
              </button>
            ))}
          </div>
        )}

        {/* Back from podcast folder */}
        {isPodcasts && selectedFolder && (
          <button
            onClick={() => setSelectedFolder(null)}
            style={{ fontSize: 12, color: 'var(--clay)', padding: 0, marginTop: 4 }}
          >
            ← All Shows
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-light)', fontSize: 13, fontStyle: 'italic' }}>Loading…</div>
        ) : isPodcasts && !selectedFolder && !searchResults ? (
          <>
            {showFolders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderLeft: '3px solid transparent',
                  borderBottom: '1px solid var(--border)',
                  background: 'none',
                  gap: 2
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--sage-pale)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--text-dark)', fontWeight: 600 }}>{folder.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{folder.consumed}/{folder.total} listened</span>
              </button>
            ))}
            <button
              onClick={handleCreateFolder}
              style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', fontSize: 13, color: 'var(--clay)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              + Add Show
            </button>
          </>
        ) : displayEntries.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-light)', fontSize: 13, fontStyle: 'italic' }}>
            {searchQuery ? 'No results.' : 'No entries yet.'}
          </div>
        ) : (
          displayEntries.map(entry => {
            const isSelected = selectedEntry && selectedEntry.id === entry.id;
            return (
              <button
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderLeft: `3px solid ${isSelected ? 'var(--clay)' : 'transparent'}`,
                  borderBottom: '1px solid var(--border)',
                  background: isSelected ? 'var(--clay-pale)' : 'none',
                  gap: 3,
                  cursor: 'pointer',
                  transition: 'all 120ms ease'
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--sage-pale)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 14,
                    color: 'var(--text-dark)',
                    fontWeight: isSelected ? 600 : 400,
                    lineHeight: 1.4,
                    flex: 1
                  }}>
                    {entry.title}
                  </span>
                  {isMedia && (
                    <span style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      borderRadius: 99,
                      fontWeight: 700,
                      background: entry.status === 'consumed' ? 'var(--sage-pale)' : 'var(--clay-pale)',
                      color: entry.status === 'consumed' ? 'var(--sage-dark)' : 'var(--clay)',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      {entry.status === 'consumed' ? '✓' : '○'}
                    </span>
                  )}
                </div>

                {entry.author && (
                  <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{entry.author}</span>
                )}
                <span style={{ fontSize: 11, color: 'var(--text-light)' }}>
                  {entry.date_field || formatDate(entry.created_at)}
                </span>

                {entry.tags && entry.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 2 }}>
                    {entry.tags.slice(0, 3).map(t => (
                      <span key={t.id} className="tag-pill" style={{ fontSize: 10, padding: '1px 6px' }}>{t.name}</span>
                    ))}
                    {entry.tags.length > 3 && (
                      <span style={{ fontSize: 10, color: 'var(--text-light)' }}>+{entry.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* New entry button at bottom */}
      {!searchResults && (
        <div style={{ padding: 10, borderTop: '1px solid var(--border)' }}>
          <button
            className="btn-primary"
            onClick={onNewEntry}
            style={{ width: '100%', fontSize: 13, padding: '7px 12px' }}
          >
            + New Entry
          </button>
        </div>
      )}
    </aside>
  );
}
