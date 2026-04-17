import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api.js';
import TagInput from './TagInput.jsx';
import RichEditor from './RichEditor.jsx';
import ImageGallery from './ImageGallery.jsx';

const SECTION_CONFIG = {
  vocabulary: { label: 'Vocabulary', statusKey: null },
  'deep-dives': { label: 'Deep Dive', statusKey: null },
  wisdom: { label: 'Wisdom', statusKey: null },
  business: { label: 'Business', statusKey: null },
  psychology: { label: 'Psychology', statusKey: null },
  books: { label: 'Book', statusKey: 'read', consumedLabel: 'Read', notConsumedLabel: 'Not Read' },
  podcasts: { label: 'Episode', statusKey: 'listened', consumedLabel: 'Listened', notConsumedLabel: 'Not Listened' },
  videos: { label: 'Video', statusKey: 'watched', consumedLabel: 'Watched', notConsumedLabel: 'Not Watched' },
  articles: { label: 'Article', statusKey: 'read', consumedLabel: 'Read', notConsumedLabel: 'Not Read' },
  documentaries: { label: 'Documentary', statusKey: 'watched', consumedLabel: 'Watched', notConsumedLabel: 'Not Watched' },
};

function Field({ label, children }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export default function EntryDetail({ entry, section, allTags, onBack, onChange, onRefreshTags }) {
  const isNew = !entry || entry._new;
  const effectiveSection = entry?.section || section;
  const config = SECTION_CONFIG[effectiveSection] || {};

  const [form, setForm] = useState({
    title: '',
    body: '',
    definition: '',
    examples: '',
    how_came_across: '',
    author: '',
    reflection: '',
    fiction_nonfiction: 'non-fiction',
    link: '',
    status: 'not-consumed',
    subsection: '',
    date_field: '',
    tags: [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fullEntry, setFullEntry] = useState(null);
  const [businessSubsections, setBusinessSubsections] = useState([]);
  const [showFolders, setShowFolders] = useState([]);
  const saveTimer = useRef(null);
  const editorKey = useRef(0);

  useEffect(() => {
    loadEntry();
    if (effectiveSection === 'business') loadBusinessSubsections();
    if (effectiveSection === 'podcasts') loadShowFolders();
  }, [entry?.id, effectiveSection]);

  async function loadEntry() {
    if (!entry) { resetForm(); return; }
    if (entry._new) {
      resetForm();
      if (entry.section === 'business') {
        const subs = await loadBusinessSubsections();
        setForm(f => ({ ...f, subsection: subs[0]?.name || '' }));
      }
      return;
    }
    try {
      const full = await api.getEntry(entry.id);
      setFullEntry(full);
      editorKey.current += 1;
      setForm({
        title: full.title || '',
        body: full.body || '',
        definition: full.definition || '',
        examples: full.examples || '',
        how_came_across: full.how_came_across || '',
        author: full.author || '',
        reflection: full.reflection || '',
        fiction_nonfiction: full.fiction_nonfiction || 'non-fiction',
        link: full.link || '',
        status: full.status || 'not-consumed',
        subsection: full.subsection || '',
        date_field: full.date_field || '',
        tags: full.tags ? full.tags.map(t => t.name) : [],
      });
    } catch (e) { console.error(e); }
  }

  function resetForm() {
    setFullEntry(null);
    editorKey.current += 1;
    setForm({
      title: '', body: '', definition: '', examples: '', how_came_across: '',
      author: '', reflection: '', fiction_nonfiction: 'non-fiction', link: '',
      status: 'not-consumed', subsection: '', date_field: '', tags: []
    });
  }

  async function loadBusinessSubsections() {
    const { businessSubsections: subs } = await api.getSettings();
    setBusinessSubsections(subs);
    return subs;
  }

  async function loadShowFolders() {
    const folders = await api.getShowFolders();
    setShowFolders(folders);
  }

  const set = (key) => (e) => {
    const val = e?.target ? e.target.value : e;
    setForm(f => ({ ...f, [key]: val }));
    scheduleSave({ ...form, [key]: val });
  };

  const setRich = (key) => (html) => {
    setForm(f => ({ ...f, [key]: html }));
    scheduleSave({ ...form, [key]: html });
  };

  function scheduleSave(data) {
    if (isNew) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(data), 1200);
  }

  async function doSave(data = form) {
    if (!fullEntry) return;
    setSaving(true);
    try {
      await api.updateEntry(fullEntry.id, data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onChange();
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, section: effectiveSection };
      if (entry?.show_folder_id) payload.show_folder_id = entry.show_folder_id;
      const created = await api.createEntry(payload);
      setFullEntry(created);
      editorKey.current += 1;
      onChange();
      onRefreshTags();
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!fullEntry) return;
    if (!window.confirm(`Delete "${fullEntry.title}"?`)) return;
    setDeleting(true);
    await api.deleteEntry(fullEntry.id);
    onChange();
    onBack();
  }

  async function handleStatusToggle() {
    if (!fullEntry) return;
    const next = form.status === 'consumed' ? 'not-consumed' : 'consumed';
    setForm(f => ({ ...f, status: next }));
    await api.patchStatus(fullEntry.id, next);
    onChange();
  }

  const openLink = (url) => {
    if (!url) return;
    if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url);
    else window.open(url, '_blank', 'noopener');
  };

  if (!entry) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-light)', fontFamily: 'var(--font-serif)', fontSize: '1rem',
        fontStyle: 'italic', background: 'var(--bg)'
      }}>
        Select an entry or create a new one.
      </div>
    );
  }

  const hasMedia = ['books', 'podcasts', 'videos', 'articles', 'documentaries'].includes(effectiveSection);

  return (
    <main className="slide-in" style={{
      flex: 1, overflow: 'auto', background: 'var(--bg)', display: 'flex', flexDirection: 'column'
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', borderBottom: '1.5px solid var(--border)',
        background: 'var(--panel)', flexShrink: 0, gap: 12, flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn-ghost mobile-only" onClick={onBack} style={{ padding: '4px 8px', fontSize: 13 }}>
            ← Back
          </button>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-light)' }}>
            {config.label || effectiveSection}
          </span>
          {saving && <span style={{ fontSize: 11, color: 'var(--text-light)', fontStyle: 'italic' }}>Saving…</span>}
          {saved && <span style={{ fontSize: 11, color: 'var(--sage-mid)', fontStyle: 'italic' }}>Saved</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasMedia && fullEntry && (
            <button
              onClick={handleStatusToggle}
              className="status-badge"
              style={{
                background: form.status === 'consumed' ? 'var(--sage-pale)' : 'var(--clay-pale)',
                color: form.status === 'consumed' ? 'var(--sage-dark)' : 'var(--clay)',
                cursor: 'pointer', border: 'none', fontSize: 12, fontWeight: 600,
                padding: '4px 12px', borderRadius: 99
              }}
            >
              {form.status === 'consumed' ? `✓ ${config.consumedLabel}` : `○ ${config.notConsumedLabel}`}
            </button>
          )}
          {isNew ? (
            <button className="btn-primary" onClick={handleCreate} disabled={saving || !form.title.trim()} style={{ fontSize: 13 }}>
              {saving ? 'Creating…' : 'Create Entry'}
            </button>
          ) : (
            <button className="btn-danger btn-ghost" onClick={handleDelete} style={{ fontSize: 13 }}>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Form body */}
      <div style={{ padding: '24px 28px', maxWidth: 820, width: '100%' }}>

        {/* Title */}
        <Field label="Title">
          <input
            type="text"
            value={form.title}
            onChange={set('title')}
            placeholder={`${config.label || 'Entry'} title…`}
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-dark)',
              background: 'transparent',
              border: 'none',
              borderBottom: '2px solid var(--border)',
              borderRadius: 0,
              padding: '4px 0',
              marginBottom: 4
            }}
          />
        </Field>

        {/* Date field */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Field label="Date">
              <input type="text" value={form.date_field} onChange={set('date_field')} placeholder="e.g. April 2024" />
            </Field>
          </div>

          {/* Business subsection */}
          {effectiveSection === 'business' && (
            <div style={{ flex: 1, minWidth: 160 }}>
              <Field label="Category">
                <select value={form.subsection} onChange={set('subsection')}>
                  {businessSubsections.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {/* Podcast show folder */}
          {effectiveSection === 'podcasts' && isNew && (
            <div style={{ flex: 1, minWidth: 160 }}>
              <Field label="Show">
                <select value={form.show_folder_id || ''} onChange={e => setForm(f => ({ ...f, show_folder_id: e.target.value }))}>
                  <option value="">Select show…</option>
                  {showFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </Field>
            </div>
          )}

          {/* Books: Fiction/Non-fiction */}
          {effectiveSection === 'books' && (
            <div style={{ flex: 1, minWidth: 140 }}>
              <Field label="Type">
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {['non-fiction', 'fiction'].map(t => (
                    <button
                      key={t}
                      onClick={() => { setForm(f => ({ ...f, fiction_nonfiction: t })); scheduleSave({ ...form, fiction_nonfiction: t }); }}
                      style={{
                        fontSize: 12, padding: '4px 12px', borderRadius: 99, fontWeight: 600,
                        background: form.fiction_nonfiction === t ? 'var(--clay)' : 'var(--sage-pale)',
                        color: form.fiction_nonfiction === t ? '#fff' : 'var(--text-mid)',
                        border: '1.5px solid',
                        borderColor: form.fiction_nonfiction === t ? 'var(--clay)' : 'var(--border)'
                      }}
                    >
                      {t === 'non-fiction' ? 'Non-Fiction' : 'Fiction'}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}
        </div>

        {/* Author (books, wisdom, podcasts) */}
        {['books', 'wisdom', 'articles', 'documentaries'].includes(effectiveSection) && (
          <Field label={effectiveSection === 'wisdom' ? 'Author / Source (optional)' : 'Author'}>
            <input type="text" value={form.author} onChange={set('author')} placeholder="Author name…" />
          </Field>
        )}

        {/* Vocabulary-specific fields */}
        {effectiveSection === 'vocabulary' && (
          <>
            <Field label="Definition">
              <textarea value={form.definition} onChange={set('definition')} placeholder="What does it mean?" rows={3} />
            </Field>
            <Field label="Examples">
              <div className="callout clay">
                <textarea
                  value={form.examples}
                  onChange={set('examples')}
                  placeholder="Usage examples…"
                  rows={3}
                />
              </div>
            </Field>
            <Field label="How I came across it">
              <div className="callout sage">
                <textarea
                  value={form.how_came_across}
                  onChange={set('how_came_across')}
                  placeholder="Where or how did you encounter this word?"
                  rows={2}
                />
              </div>
            </Field>
          </>
        )}

        {/* Wisdom-specific body (italic quote) */}
        {effectiveSection === 'wisdom' && (
          <>
            <Field label="Quote or Lesson">
              <textarea
                value={form.body}
                onChange={set('body')}
                placeholder="The quote or insight…"
                rows={5}
                style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 16 }}
              />
            </Field>
            <hr className="divider" />
            <Field label="Personal Reflection">
              <textarea value={form.reflection} onChange={set('reflection')} placeholder="Your thoughts on this…" rows={4} />
            </Field>
          </>
        )}

        {/* Deep Dives: full rich canvas */}
        {effectiveSection === 'deep-dives' && (
          <Field label="Notes">
            <RichEditor
              key={editorKey.current}
              value={form.body}
              onChange={setRich('body')}
              placeholder="Your deep dive canvas — write freely…"
              minHeight={400}
            />
          </Field>
        )}

        {/* Business / Psychology: rich body */}
        {['business', 'psychology'].includes(effectiveSection) && (
          <Field label="Notes">
            <RichEditor
              key={editorKey.current}
              value={form.body}
              onChange={setRich('body')}
              placeholder="Write your notes here…"
              minHeight={320}
            />
          </Field>
        )}

        {/* Media sections: notes body */}
        {['books', 'podcasts', 'videos', 'articles', 'documentaries'].includes(effectiveSection) && (
          <Field label="Notes">
            <textarea value={form.body} onChange={set('body')} placeholder="Your notes…" rows={8} style={{ fontFamily: 'var(--font-serif)' }} />
          </Field>
        )}

        {/* Link field for podcast/video/article/documentary */}
        {['podcasts', 'videos', 'articles', 'documentaries'].includes(effectiveSection) && (
          <Field label="Link">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="url"
                value={form.link}
                onChange={set('link')}
                placeholder="https://…"
                style={{ flex: 1 }}
              />
              {form.link && (
                <button
                  onClick={() => openLink(form.link)}
                  style={{
                    flexShrink: 0, fontSize: 12, padding: '6px 12px', borderRadius: 'var(--radius)',
                    background: 'var(--sage-pale)', color: 'var(--sage-dark)', border: '1px solid var(--border)'
                  }}
                >
                  Open ↗
                </button>
              )}
            </div>
          </Field>
        )}

        {/* Tags */}
        <Field label="Tags">
          <TagInput
            tags={form.tags}
            allTags={allTags}
            onChange={(tags) => {
              setForm(f => ({ ...f, tags }));
              scheduleSave({ ...form, tags });
            }}
          />
        </Field>

        {/* Image gallery (all except deep-dives which has inline) */}
        {fullEntry && effectiveSection !== 'deep-dives' && (
          <ImageGallery entryId={fullEntry.id} images={fullEntry.images || []} onRefresh={loadEntry} />
        )}

        {/* Save button only for new entries */}
        {isNew && (
          <div style={{ marginTop: 24 }}>
            <button
              className="btn-primary"
              onClick={handleCreate}
              disabled={saving || !form.title.trim()}
              style={{ padding: '10px 28px', fontSize: 14 }}
            >
              {saving ? 'Creating…' : 'Create Entry'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
