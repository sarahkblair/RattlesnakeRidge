import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api.js';
import ConfirmDialog from './ConfirmDialog.jsx';

const SECTIONS = [
  { id: 'tags', label: 'Tags' },
  { id: 'business', label: 'Business Categories' },
  { id: 'vocab', label: 'Vocabulary Sort' },
  { id: 'meditation', label: 'Custom Techniques' },
  { id: 'rss', label: 'RSS Feeds' },
  { id: 'spotify', label: 'Spotify' },
  { id: 'ai', label: 'Claude API' },
  { id: 'data', label: 'Data' },
];

function SectionHeading({ children }) {
  return <h3 style={{ marginBottom: 14, color: 'var(--clay)', fontSize: 15 }}>{children}</h3>;
}

function Divider() {
  return <hr style={{ border: 'none', borderTop: '1.5px solid var(--border)', margin: '32px 0' }} />;
}

// ── Tags ──────────────────────────────────────────────────────────────────────
function TagsSection({ tags, onRefreshTags }) {
  const [renaming, setRenaming] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function handleRename(tag) {
    const name = renaming[tag.id];
    if (!name?.trim() || name === tag.name) { setRenaming(r => ({ ...r, [tag.id]: undefined })); return; }
    await api.renameTag(tag.id, name.trim());
    onRefreshTags();
    setRenaming(r => ({ ...r, [tag.id]: undefined }));
  }

  return (
    <div>
      <SectionHeading>Tags</SectionHeading>
      {tags.length === 0 && <p style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: 14 }}>No tags yet.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tags.map(tag => (
          <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {renaming[tag.id] !== undefined ? (
              <>
                <input value={renaming[tag.id]} onChange={e => setRenaming(r => ({ ...r, [tag.id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleRename(tag); if (e.key === 'Escape') setRenaming(r => ({ ...r, [tag.id]: undefined })); }}
                  autoFocus style={{ flex: 1, fontSize: 13 }} />
                <button className="btn-primary" onClick={() => handleRename(tag)} style={{ fontSize: 12, padding: '4px 12px' }}>Save</button>
                <button className="btn-ghost" onClick={() => setRenaming(r => ({ ...r, [tag.id]: undefined }))} style={{ fontSize: 12 }}>Cancel</button>
              </>
            ) : (
              <>
                <span className="tag-pill" style={{ fontSize: 12 }}>{tag.name}</span>
                <button className="btn-ghost" onClick={() => setRenaming(r => ({ ...r, [tag.id]: tag.name }))} style={{ fontSize: 12 }}>Rename</button>
                <button className="btn-danger btn-ghost" onClick={() => setConfirmDelete(tag)} style={{ fontSize: 12 }}>Delete</button>
              </>
            )}
          </div>
        ))}
      </div>
      {confirmDelete && (
        <ConfirmDialog
          message={`Delete tag "${confirmDelete.name}"?`}
          detail="It will be removed from all entries."
          onConfirm={async () => { await api.deleteTag(confirmDelete.id); setConfirmDelete(null); onRefreshTags(); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ── Business Categories ───────────────────────────────────────────────────────
function BusinessSection() {
  const [subs, setSubs] = useState([]);
  const [newName, setNewName] = useState('');

  useEffect(() => { api.getSettings().then(({ businessSubsections }) => setSubs(businessSubsections)).catch(() => {}); }, []);

  async function handleAdd() {
    if (!newName.trim()) return;
    await api.addBusinessSubsection(newName.trim());
    setNewName('');
    api.getSettings().then(({ businessSubsections }) => setSubs(businessSubsections)).catch(() => {});
  }

  async function handleDelete(id) {
    await api.deleteBusinessSubsection(id);
    setSubs(s => s.filter(x => x.id !== id));
  }

  return (
    <div>
      <SectionHeading>Business Categories</SectionHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {subs.map(sub => (
          <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--text-mid)' }}>{sub.name}</span>
            <button className="btn-danger btn-ghost" onClick={() => handleDelete(sub.id)} style={{ fontSize: 12 }}>Remove</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="New category…" style={{ flex: 1, fontSize: 13 }} />
        <button className="btn-primary" onClick={handleAdd} style={{ fontSize: 13, padding: '6px 16px' }}>Add</button>
      </div>
    </div>
  );
}

// ── Vocabulary Sort ───────────────────────────────────────────────────────────
function VocabSortSection() {
  const [vocabSort, setVocabSort] = useState('date-desc');
  useEffect(() => { api.getSettings().then(({ settings }) => setVocabSort(settings.vocabulary_sort || 'date-desc')).catch(() => {}); }, []);

  async function handleChange(val) {
    setVocabSort(val);
    await api.updateSetting('vocabulary_sort', val);
  }

  return (
    <div>
      <SectionHeading>Vocabulary Default Sort</SectionHeading>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[['date-desc','Newest First'],['date-asc','Oldest First'],['alpha-asc','A → Z'],['alpha-desc','Z → A']].map(([val, label]) => (
          <button key={val} onClick={() => handleChange(val)} style={{ fontSize: 13, padding: '6px 14px', borderRadius: 99, fontWeight: 600, background: vocabSort === val ? 'var(--clay)' : 'var(--sage-pale)', color: vocabSort === val ? '#fff' : 'var(--text-mid)', border: `1.5px solid ${vocabSort === val ? 'var(--clay)' : 'var(--border)'}` }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Custom Meditation Techniques ──────────────────────────────────────────────
function MeditationSection() {
  const [techniques, setTechniques] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'breathing', inhale_seconds: 4, hold_in_seconds: 0, exhale_seconds: 6, hold_out_seconds: 0 });

  useEffect(() => { api.getMeditationTechniques().then(t => setTechniques(t.filter(x => x.is_custom))).catch(() => {}); }, []);

  async function handleAdd() {
    if (!form.name.trim()) return;
    await api.createTechnique(form);
    api.getMeditationTechniques().then(t => setTechniques(t.filter(x => x.is_custom))).catch(() => {});
    setAdding(false);
    setForm({ name: '', description: '', category: 'breathing', inhale_seconds: 4, hold_in_seconds: 0, exhale_seconds: 6, hold_out_seconds: 0 });
  }

  async function handleDelete(id) {
    await api.deleteTechnique(id);
    setTechniques(t => t.filter(x => x.id !== id));
  }

  return (
    <div>
      <SectionHeading>Custom Meditation Techniques</SectionHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {techniques.length === 0 && !adding && <p style={{ fontSize: 13, color: 'var(--text-light)', fontStyle: 'italic' }}>No custom techniques yet.</p>}
        {techniques.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <span style={{ flex: 1, fontSize: 13 }}>{t.name} <span style={{ color: 'var(--text-light)', fontSize: 11 }}>({t.category})</span></span>
            <button className="btn-danger btn-ghost" onClick={() => handleDelete(t.id)} style={{ fontSize: 12 }}>Delete</button>
          </div>
        ))}
      </div>
      {adding ? (
        <div style={{ padding: 14, background: 'var(--card)', borderRadius: 'var(--radius)', border: '1.5px solid var(--clay-light)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name*" style={{ flex: 2, fontSize: 13 }} />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ flex: 1, fontSize: 13 }}>
              <option value="breathing">Breathing</option>
              <option value="meditation">Meditation</option>
            </select>
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)" rows={2} style={{ fontSize: 13, marginBottom: 8 }} />
          {form.category === 'breathing' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {[['inhale_seconds','Inhale'],['hold_in_seconds','Hold In'],['exhale_seconds','Exhale'],['hold_out_seconds','Hold Out']].map(([k, lbl]) => (
                <div key={k} style={{ flex: 1, minWidth: 80 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 3 }}>{lbl} (s)</div>
                  <input type="number" min={0} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: Number(e.target.value) }))} style={{ fontSize: 13 }} />
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={handleAdd} disabled={!form.name.trim()} style={{ fontSize: 12 }}>Save</button>
            <button className="btn-ghost" onClick={() => setAdding(false)} style={{ fontSize: 12 }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn-outline" onClick={() => setAdding(true)} style={{ fontSize: 13 }}>+ Add Technique</button>
      )}
    </div>
  );
}

// ── RSS Feeds ─────────────────────────────────────────────────────────────────
function RssSection() {
  const [feeds, setFeeds] = useState([]);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.getRssFeeds().then(setFeeds).catch(() => {}); }, []);

  async function handleAdd() {
    if (!url.trim()) return;
    setSaving(true);
    try { await api.addRssFeed({ url: url.trim(), name: name.trim() || url.trim() }); api.getRssFeeds().then(setFeeds); setUrl(''); setName(''); }
    catch (e) { console.error(e); }
    setSaving(false);
  }

  return (
    <div>
      <SectionHeading>RSS Feeds</SectionHeading>
      <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 12 }}>Add RSS feeds to power the Today's Reading suggestions.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {feeds.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-light)', fontStyle: 'italic' }}>No feeds added yet.</p>}
        {feeds.map(feed => (
          <div key={feed.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{feed.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-light)', wordBreak: 'break-all' }}>{feed.url}</div>
            </div>
            <button className="btn-danger btn-ghost" onClick={async () => { await api.deleteRssFeed(feed.id); setFeeds(f => f.filter(x => x.id !== feed.id)); }} style={{ fontSize: 12 }}>Remove</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Feed name (optional)" style={{ fontSize: 13 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/feed.xml" style={{ flex: 1, fontSize: 13 }} />
          <button className="btn-primary" onClick={handleAdd} disabled={saving || !url.trim()} style={{ fontSize: 13, padding: '6px 16px', whiteSpace: 'nowrap' }}>
            {saving ? 'Adding…' : 'Add Feed'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Spotify ───────────────────────────────────────────────────────────────────
function SpotifySection() {
  const [status, setStatus] = useState(null);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.getSpotifyStatus().then(setStatus).catch(() => {}); }, []);

  async function handleSavePlaylist() {
    if (!playlistUrl.trim()) return;
    setSaving(true);
    try { await api.updateSetting('spotify_playlist_uri', playlistUrl.trim()); setStatus(s => ({ ...s, hasPlaylist: true })); setPlaylistUrl(''); }
    catch (e) { console.error(e); }
    setSaving(false);
  }

  return (
    <div>
      <SectionHeading>Spotify Integration</SectionHeading>
      <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>Connect Spotify to play a meditation playlist during sessions.</p>

      {status?.connected ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 14px', background: 'var(--sage-pale)', borderRadius: 'var(--radius)' }}>
          <span style={{ fontSize: 13, color: 'var(--sage-dark)', fontWeight: 600 }}>✓ Connected</span>
        </div>
      ) : (
        <a href="/api/spotify/auth" style={{ display: 'inline-block', padding: '8px 18px', borderRadius: 'var(--radius)', background: '#1DB954', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', marginBottom: 16 }}>
          Connect Spotify
        </a>
      )}

      <div className="form-field">
        <label className="form-label">Meditation Playlist URI or URL</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={playlistUrl} onChange={e => setPlaylistUrl(e.target.value)} placeholder="spotify:playlist:... or https://open.spotify.com/playlist/..." style={{ flex: 1, fontSize: 13 }} />
          <button className="btn-primary" onClick={handleSavePlaylist} disabled={saving || !playlistUrl.trim()} style={{ fontSize: 13, whiteSpace: 'nowrap' }}>Save</button>
        </div>
        {status?.hasPlaylist && <p style={{ fontSize: 12, color: 'var(--sage-mid)', marginTop: 4 }}>✓ Playlist configured</p>}
      </div>
    </div>
  );
}

// ── Claude API ────────────────────────────────────────────────────────────────
function ClaudeApiSection() {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then(({ settings }) => { if (settings.anthropic_key_configured === 'true') setSaved(true); }).catch(() => {});
  }, []);

  async function handleSave() {
    if (!key.trim()) return;
    setSaving(true);
    try { await api.updateSetting('anthropic_api_key', key.trim()); setSaved(true); setKey(''); }
    catch (e) { console.error(e); }
    setSaving(false);
  }

  return (
    <div>
      <SectionHeading>Claude API Key</SectionHeading>
      <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 12 }}>Used for NLP search, Today's Reading generation, and the Personal Shopper.</p>
      {saved && <p style={{ fontSize: 13, color: 'var(--sage-mid)', marginBottom: 12 }}>✓ API key is configured.</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder={saved ? 'Enter new key to replace…' : 'sk-ant-…'} style={{ flex: 1, fontSize: 13 }} />
        <button className="btn-primary" onClick={handleSave} disabled={saving || !key.trim()} style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
          {saving ? 'Saving…' : 'Save Key'}
        </button>
      </div>
    </div>
  );
}

// ── Data Import / Export ──────────────────────────────────────────────────────
function DataSection() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef(null);

  async function handleExport() {
    setExporting(true);
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `sarahs-brain-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    setExporting(false);
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true); setImportMsg('');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await api.importData(data);
      setImportMsg('✓ Import successful! Refresh the page to see your data.');
    } catch (err) {
      setImportMsg(`Import failed: ${err.message}`);
    }
    setImporting(false);
    e.target.value = '';
  }

  return (
    <div>
      <SectionHeading>Data</SectionHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 10 }}>Export a full JSON backup of all your entries, tags, and settings.</p>
          <button className="btn-primary" onClick={handleExport} disabled={exporting} style={{ fontSize: 13 }}>
            {exporting ? 'Preparing…' : '⬇ Export All Data'}
          </button>
        </div>
        <div>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 10 }}>Import from a previously exported JSON file.</p>
          <button className="btn-outline" onClick={() => fileRef.current?.click()} disabled={importing} style={{ fontSize: 13 }}>
            {importing ? 'Importing…' : '⬆ Import Data'}
          </button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          {importMsg && <p style={{ fontSize: 13, marginTop: 8, color: importMsg.startsWith('✓') ? 'var(--sage-mid)' : '#c0392b' }}>{importMsg}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Main Settings ─────────────────────────────────────────────────────────────
export default function Settings({ onClose, tags, onRefreshTags }) {
  const [activeSection, setActiveSection] = useState('tags');

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{ width: 180, flexShrink: 0, borderRight: '1.5px solid var(--border)', background: 'var(--panel)', padding: '16px 0', overflowY: 'auto' }}>
        <div style={{ padding: '0 16px 12px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-light)' }}>Settings</div>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 16px', fontSize: 13, fontWeight: activeSection === s.id ? 700 : 400, background: activeSection === s.id ? 'var(--clay-pale)' : 'transparent', color: activeSection === s.id ? 'var(--clay)' : 'var(--text-mid)', borderLeft: `3px solid ${activeSection === s.id ? 'var(--clay)' : 'transparent'}` }}>
            {s.label}
          </button>
        ))}
        <div style={{ padding: '20px 16px 0' }}>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: 12, width: '100%', textAlign: 'left' }}>← Close Settings</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', maxWidth: 680 }}>
        {activeSection === 'tags'       && <TagsSection tags={tags} onRefreshTags={onRefreshTags} />}
        {activeSection === 'business'   && <BusinessSection />}
        {activeSection === 'vocab'      && <VocabSortSection />}
        {activeSection === 'meditation' && <MeditationSection />}
        {activeSection === 'rss'        && <RssSection />}
        {activeSection === 'spotify'    && <SpotifySection />}
        {activeSection === 'ai'         && <ClaudeApiSection />}
        {activeSection === 'data'       && <DataSection />}
      </div>
    </div>
  );
}
