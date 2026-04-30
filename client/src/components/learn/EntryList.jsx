import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';

const MEDIA = ['books', 'podcasts', 'videos', 'articles', 'documentaries'];
const LABEL = { vocabulary:'Vocabulary','deep-dives':'Deep Dives',wisdom:'Wisdom',business:'Business',psychology:'Psychology',books:'Books',podcasts:'Podcasts',videos:'Videos',articles:'Articles',documentaries:'Documentaries' };
const VERB = { books:'read',podcasts:'listened',videos:'watched',articles:'read',documentaries:'watched' };

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EntryList({ section, activeTag, selectedEntry, searchQuery, searchResults, searchMode, podcastFolder, onPodcastFolder, onSelectEntry, onNewEntry, isMobile }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [bookTab, setBookTab] = useState('not-consumed'); // for books: currently reading / to-read / read
  const [showFolders, setShowFolders] = useState([]);

  const isMedia = MEDIA.includes(section);
  const isPodcasts = section === 'podcasts';
  const isBooks = section === 'books';

  useEffect(() => { setStatusFilter('all'); setBookTab('not-consumed'); load(); }, [section, activeTag]);
  useEffect(() => { if (!searchQuery) load(); }, [statusFilter, bookTab, podcastFolder]);

  async function load() {
    setLoading(true);
    try {
      if (activeTag) {
        setEntries(await api.getEntriesByTag(activeTag.id));
      } else if (isPodcasts && !podcastFolder) {
        const folders = await api.getShowFolders();
        setShowFolders(folders);
        setEntries([]);
      } else {
        const params = { section };
        if (isPodcasts && podcastFolder) params.show_folder_id = podcastFolder.id;
        if (isBooks) params.status = bookTab === 'read' ? 'consumed' : bookTab === 'reading' ? 'reading' : 'not-consumed';
        else if (isMedia && statusFilter !== 'all') params.status = statusFilter;
        setEntries(await api.getEntries(params));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const display = searchResults && !searchResults.ai ? searchResults.results : entries;
  const consumed = display.filter(e => e.status === 'consumed').length;

  return (
    <aside className="entry-list">
      {/* Header */}
      <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>
            {activeTag ? `#${activeTag.name}` : (LABEL[section] || section)}
          </span>
          {isMedia && !searchResults && (
            <span style={{ fontSize: 10, color: 'var(--text-light)', fontWeight: 600 }}>
              {consumed}/{display.length} {VERB[section] || 'done'}
            </span>
          )}
        </div>

        {/* Books: three-tab row */}
        {isBooks && !activeTag && !searchResults && (
          <div style={{ display: 'flex', gap: 3 }}>
            {[['not-consumed','To Read'],['reading','Reading'],['consumed','Read']].map(([val, lbl]) => (
              <button key={val} onClick={() => setBookTab(val)} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 700, background: bookTab === val ? 'var(--clay)' : 'transparent', color: bookTab === val ? '#fff' : 'var(--text-light)', border: `1px solid ${bookTab === val ? 'var(--clay)' : 'var(--border)'}` }}>
                {lbl}
              </button>
            ))}
          </div>
        )}

        {/* Media: consumed filter */}
        {isMedia && !isBooks && !activeTag && !searchResults && (
          <div style={{ display: 'flex', gap: 3 }}>
            {[['all','All'],['not-consumed','Not Yet'],['consumed','Done']].map(([val, lbl]) => (
              <button key={val} onClick={() => setStatusFilter(val)} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 700, background: statusFilter === val ? 'var(--clay)' : 'transparent', color: statusFilter === val ? '#fff' : 'var(--text-light)', border: `1px solid ${statusFilter === val ? 'var(--clay)' : 'var(--border)'}` }}>
                {lbl}
              </button>
            ))}
          </div>
        )}

        {isPodcasts && podcastFolder && (
          <button onClick={() => onPodcastFolder(null)} style={{ fontSize: 11, color: 'var(--clay)', padding: 0, marginTop: 3 }}>← All Shows</button>
        )}
      </div>

      {/* AI search results */}
      {searchResults?.ai && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 10, fontStyle: 'italic' }}>Claude found these for "{searchResults.query}"</div>
          {(searchResults.results || []).map((r, i) => (
            <div key={i} style={{ marginBottom: 12, padding: 10, background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 6 }}>{r.source} · {r.type}</div>
              {r.summary && <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{r.summary}</div>}
              {r.url && <button onClick={() => { if (window.electronAPI?.openExternal) window.electronAPI.openExternal(r.url); else window.open(r.url, '_blank', 'noopener'); }} style={{ fontSize: 11, color: 'var(--clay)', marginTop: 6, padding: 0 }}>Open ↗</button>}
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {!searchResults?.ai && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-light)', fontSize: 13, fontStyle: 'italic' }}>Loading…</div>
          ) : isPodcasts && !podcastFolder && !searchResults ? (
            <>
              {showFolders.map(folder => (
                <button key={folder.id} onClick={() => onPodcastFolder(folder)} className="entry-item" style={{ display: 'flex', flexDirection: 'column', borderLeft: '3px solid transparent' }}>
                  <span className="entry-title">{folder.name}</span>
                  <span className="entry-meta">{folder.consumed || 0}/{folder.total || 0} listened</span>
                </button>
              ))}
              <button onClick={async () => { const n = prompt('Show name:'); if (n) { await api.createShowFolder(n); load(); } }} style={{ display: 'block', width: '100%', padding: '10px 14px', fontSize: 13, color: 'var(--clay)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>+ Add Show</button>
            </>
          ) : display.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-light)', fontSize: 13, fontStyle: 'italic' }}>
              {searchQuery ? 'No results.' : 'No entries yet.'}
            </div>
          ) : (
            display.map(entry => {
              const isActive = selectedEntry?.id === entry.id;
              return (
                <button key={entry.id} className={`entry-item${isActive ? ' active' : ''}`} onClick={() => onSelectEntry(entry)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                    <span className="entry-title" style={{ flex: 1, fontWeight: isActive ? 600 : 400 }}>{entry.title}</span>
                    {isMedia && (
                      <span style={{ fontSize: 9, padding: '2px 5px', borderRadius: 99, fontWeight: 700, background: entry.status === 'consumed' ? 'var(--sage-pale)' : 'var(--clay-pale)', color: entry.status === 'consumed' ? 'var(--sage-dark)' : 'var(--clay)', flexShrink: 0, marginTop: 2 }}>
                        {entry.status === 'consumed' ? '✓' : '○'}
                      </span>
                    )}
                  </div>
                  {entry.author && <span className="entry-meta">{entry.author}</span>}
                  <span className="entry-meta">{entry.date_field || formatDate(entry.created_at)}</span>
                  {entry.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 2 }}>
                      {entry.tags.slice(0, 3).map(t => <span key={t.id} className="tag-pill" style={{ fontSize: 9, padding: '1px 5px' }}>{t.name}</span>)}
                      {entry.tags.length > 3 && <span style={{ fontSize: 9, color: 'var(--text-light)' }}>+{entry.tags.length - 3}</span>}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {!searchResults && (
        <div style={{ padding: 8, borderTop: '1px solid var(--border)' }}>
          <button className="btn-primary" onClick={onNewEntry} style={{ width: '100%', fontSize: 12, padding: '7px 10px' }}>+ New Entry</button>
        </div>
      )}
    </aside>
  );
}
