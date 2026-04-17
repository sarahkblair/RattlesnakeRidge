import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';

export default function Settings({ onClose, tags, onRefreshTags }) {
  const [businessSubs, setBusinessSubs] = useState([]);
  const [vocabSort, setVocabSort] = useState('date-desc');
  const [renaming, setRenaming] = useState({});
  const [newSubName, setNewSubName] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { settings, businessSubsections } = await api.getSettings();
    setBusinessSubs(businessSubsections);
    setVocabSort(settings.vocabulary_sort || 'date-desc');
  }

  async function handleVocabSort(val) {
    setVocabSort(val);
    await api.updateSetting('vocabulary_sort', val);
  }

  async function handleRenameTag(tag) {
    const name = renaming[tag.id];
    if (!name || name === tag.name) { setRenaming(r => ({ ...r, [tag.id]: undefined })); return; }
    await api.renameTag(tag.id, name);
    onRefreshTags();
    setRenaming(r => ({ ...r, [tag.id]: undefined }));
  }

  async function handleDeleteTag(tag) {
    if (!window.confirm(`Delete tag "${tag.name}"? It will be removed from all entries.`)) return;
    await api.deleteTag(tag.id);
    onRefreshTags();
  }

  async function handleAddSub() {
    if (!newSubName.trim()) return;
    await api.addBusinessSubsection(newSubName.trim());
    setNewSubName('');
    load();
  }

  async function handleDeleteSub(id) {
    if (!window.confirm('Remove this business sub-section?')) return;
    await api.deleteBusinessSubsection(id);
    load();
  }

  async function handleExport() {
    setExporting(true);
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sarahs-brain-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    setExporting(false);
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', maxWidth: 680 }}>
      <h2 style={{ marginBottom: 6 }}>Settings</h2>
      <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 32 }}>Manage tags, sub-sections, and preferences.</p>

      {/* Tags */}
      <section style={{ marginBottom: 40 }}>
        <h3 style={{ marginBottom: 14, color: 'var(--clay)' }}>Tags</h3>
        {tags.length === 0 && (
          <p style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: 14 }}>No tags yet.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tags.map(tag => (
            <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {renaming[tag.id] !== undefined ? (
                <>
                  <input
                    value={renaming[tag.id]}
                    onChange={e => setRenaming(r => ({ ...r, [tag.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') handleRenameTag(tag); if (e.key === 'Escape') setRenaming(r => ({ ...r, [tag.id]: undefined })); }}
                    autoFocus
                    style={{ flex: 1, fontSize: 13 }}
                  />
                  <button className="btn-primary" onClick={() => handleRenameTag(tag)} style={{ fontSize: 12, padding: '4px 12px' }}>Save</button>
                  <button className="btn-ghost" onClick={() => setRenaming(r => ({ ...r, [tag.id]: undefined }))} style={{ fontSize: 12 }}>Cancel</button>
                </>
              ) : (
                <>
                  <span className="tag-pill" style={{ fontSize: 12 }}>{tag.name}</span>
                  <button className="btn-ghost" onClick={() => setRenaming(r => ({ ...r, [tag.id]: tag.name }))} style={{ fontSize: 12 }}>Rename</button>
                  <button className="btn-danger btn-ghost" onClick={() => handleDeleteTag(tag)} style={{ fontSize: 12 }}>Delete</button>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Business Sub-sections */}
      <section style={{ marginBottom: 40 }}>
        <h3 style={{ marginBottom: 14, color: 'var(--clay)' }}>Business Categories</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {businessSubs.map(sub => (
            <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: 1, fontSize: 14, color: 'var(--text-mid)' }}>{sub.name}</span>
              <button className="btn-danger btn-ghost" onClick={() => handleDeleteSub(sub.id)} style={{ fontSize: 12 }}>Remove</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newSubName}
            onChange={e => setNewSubName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddSub()}
            placeholder="New sub-section name…"
            style={{ flex: 1, fontSize: 13 }}
          />
          <button className="btn-primary" onClick={handleAddSub} style={{ fontSize: 13, padding: '6px 16px' }}>Add</button>
        </div>
      </section>

      {/* Vocabulary Sort */}
      <section style={{ marginBottom: 40 }}>
        <h3 style={{ marginBottom: 14, color: 'var(--clay)' }}>Vocabulary Default Sort</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { val: 'date-desc', label: 'Newest First' },
            { val: 'date-asc', label: 'Oldest First' },
            { val: 'alpha-asc', label: 'A → Z' },
            { val: 'alpha-desc', label: 'Z → A' }
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => handleVocabSort(val)}
              style={{
                fontSize: 13, padding: '6px 14px', borderRadius: 99, fontWeight: 600,
                background: vocabSort === val ? 'var(--clay)' : 'var(--sage-pale)',
                color: vocabSort === val ? '#fff' : 'var(--text-mid)',
                border: '1.5px solid',
                borderColor: vocabSort === val ? 'var(--clay)' : 'var(--border)'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Theme */}
      <section style={{ marginBottom: 40 }}>
        <h3 style={{ marginBottom: 14, color: 'var(--clay)' }}>Theme</h3>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          background: 'var(--card)',
          borderRadius: 'var(--radius)',
          border: '1.5px solid var(--border)'
        }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--clay)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>Cactus Light</span>
          <span style={{ fontSize: 11, color: 'var(--text-light)' }}>(active)</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 8, fontStyle: 'italic' }}>Dark mode coming in a future update.</p>
      </section>

      {/* Export */}
      <section style={{ marginBottom: 40 }}>
        <h3 style={{ marginBottom: 8, color: 'var(--clay)' }}>Data Export</h3>
        <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 12 }}>
          Download a full JSON backup of all your entries, tags, and settings.
        </p>
        <button
          className="btn-primary"
          onClick={handleExport}
          disabled={exporting}
          style={{ fontSize: 13 }}
        >
          {exporting ? 'Preparing…' : '⬇ Export All Data'}
        </button>
      </section>
    </div>
  );
}
