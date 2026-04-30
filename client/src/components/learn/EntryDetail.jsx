import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../utils/api.js';
import TagInput from '../TagInput.jsx';
import TipTapEditor from '../TipTapEditor.jsx';
import ImageGallery from '../ImageGallery.jsx';
import ConfirmDialog from '../ConfirmDialog.jsx';

const MEDIA = ['books','podcasts','videos','articles','documentaries'];
const STATUS_LABEL = { books:['Read','Not Read'], podcasts:['Listened','Not Listened'], videos:['Watched','Not Watched'], articles:['Read','Not Read'], documentaries:['Watched','Not Watched'] };

function Field({ label, children, style }) {
  return <div className="form-field" style={style}><label className="form-label">{label}</label>{children}</div>;
}

export default function EntryDetail({ entry, isNew, section, podcastFolderId, allTags, onBack, onSaved, onRefreshTags, isMobile }) {
  const [form, setForm] = useState({ title:'', body:'', definition:'', examples:'', how_came_across:'', author:'', reflection:'', fiction_nonfiction:'non-fiction', link:'', status:'not-consumed', subsection:'', date_field:'', tags:[] });
  const [fullEntry, setFullEntry] = useState(null);
  const [businessSubs, setBusinessSubs] = useState([]);
  const [pairings, setPairings] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [showPairingDropdown, setShowPairingDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const saveTimer = useRef(null);
  const editorKey = useRef(0);

  const effectiveSection = entry?.section || section;
  const isMedia = MEDIA.includes(effectiveSection);
  const isBooks = effectiveSection === 'books';
  const richTextSections = ['deep-dives','business','psychology'];

  useEffect(() => {
    load();
    if (effectiveSection === 'business') api.getSettings().then(({ businessSubsections }) => setBusinessSubs(businessSubsections)).catch(() => {});
    if (isBooks) api.getEntries({ section: 'books' }).then(setAllBooks).catch(() => {});
  }, [entry?.id, effectiveSection, isNew]);

  async function load() {
    if (isNew || !entry) { resetForm(); return; }
    try {
      const full = await api.getEntry(entry.id);
      setFullEntry(full);
      editorKey.current++;
      setForm({
        title: full.title||'', body: full.body||'', definition: full.definition||'',
        examples: full.examples||'', how_came_across: full.how_came_across||'',
        author: full.author||'', reflection: full.reflection||'',
        fiction_nonfiction: full.fiction_nonfiction||'non-fiction',
        link: full.link||'', status: full.status||'not-consumed',
        subsection: full.subsection||'', date_field: full.date_field||'',
        tags: full.tags ? full.tags.map(t => t.name) : []
      });
      if (isBooks) {
        try { const p = await api.getBookPairings(full.id); setPairings(p.map(p => p.paired_id)); } catch (e) {}
      }
    } catch (e) { console.error(e); }
  }

  function resetForm() {
    setFullEntry(null); editorKey.current++;
    setForm({ title:'', body:'', definition:'', examples:'', how_came_across:'', author:'', reflection:'', fiction_nonfiction:'non-fiction', link:'', status:'not-consumed', subsection:'', date_field:'', tags:[] });
    setPairings([]);
  }

  const set = key => e => {
    const val = e?.target ? e.target.value : e;
    setForm(f => ({ ...f, [key]: val }));
    schedSave({ ...form, [key]: val });
  };

  const setRich = key => html => { setForm(f => ({ ...f, [key]: html })); schedSave({ ...form, [key]: html }); };

  function schedSave(data) {
    if (isNew) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(data), 1400);
  }

  async function doSave(data = form) {
    if (!fullEntry) return;
    setSaving(true);
    try {
      await api.updateEntry(fullEntry.id, data);
      if (isBooks) await api.setBookPairings(fullEntry.id, pairings);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
      onSaved();
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, section: effectiveSection };
      if (podcastFolderId) payload.show_folder_id = podcastFolderId;
      const created = await api.createEntry(payload);
      setFullEntry(created);
      editorKey.current++;
      if (isBooks && pairings.length) await api.setBookPairings(created.id, pairings);
      onSaved();
      onRefreshTags();
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!fullEntry) return;
    await api.deleteEntry(fullEntry.id);
    onSaved(); onBack();
  }

  async function handleStatusToggle() {
    if (!fullEntry) return;
    const next = form.status === 'consumed' ? 'not-consumed' : 'consumed';
    setForm(f => ({ ...f, status: next }));
    await api.patchStatus(fullEntry.id, next);
    onSaved();
  }

  const openLink = url => {
    if (!url) return;
    if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url);
    else window.open(url, '_blank', 'noopener');
  };

  const togglePairing = (bookId) => {
    setPairings(prev => prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]);
    if (fullEntry) schedSave(form);
  };

  if (!entry && !isNew) {
    return (
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', background: 'var(--bg)' }}>
        Select an entry or create a new one.
      </main>
    );
  }

  const sLabel = STATUS_LABEL[effectiveSection];

  return (
    <main className="slide-in" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1.5px solid var(--border)', background: 'var(--panel)', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn-ghost mobile-only" onClick={onBack} style={{ fontSize: 13 }}>← Back</button>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-light)' }}>{effectiveSection.replace('-', ' ')}</span>
          {saving && <span style={{ fontSize: 11, color: 'var(--text-light)', fontStyle: 'italic' }}>Saving…</span>}
          {saved && <span style={{ fontSize: 11, color: 'var(--sage-mid)', fontStyle: 'italic' }}>✓ Saved</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isMedia && fullEntry && sLabel && (
            <button onClick={handleStatusToggle} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 99, fontWeight: 700, cursor: 'pointer', border: 'none', background: form.status === 'consumed' ? 'var(--sage-pale)' : 'var(--clay-pale)', color: form.status === 'consumed' ? 'var(--sage-dark)' : 'var(--clay)' }}>
              {form.status === 'consumed' ? `✓ ${sLabel[0]}` : `○ ${sLabel[1]}`}
            </button>
          )}
          {isNew ? (
            <button className="btn-primary" onClick={handleCreate} disabled={saving || !form.title.trim()} style={{ fontSize: 13 }}>
              {saving ? 'Creating…' : 'Create Entry'}
            </button>
          ) : (
            <button className="btn-danger btn-ghost" onClick={() => setConfirm(true)} style={{ fontSize: 13 }}>Delete</button>
          )}
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '22px 26px', maxWidth: 820 }}>
        {/* Title */}
        <div className="form-field">
          <input type="text" value={form.title} onChange={set('title')} placeholder="Title…" style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, background: 'transparent', border: 'none', borderBottom: '2px solid var(--border)', borderRadius: 0, padding: '4px 0' }} />
        </div>

        {/* Metadata row */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Field label="Date"><input type="text" value={form.date_field} onChange={set('date_field')} placeholder="e.g. April 2024" /></Field>
          </div>
          {effectiveSection === 'business' && (
            <div style={{ flex: 1, minWidth: 140 }}>
              <Field label="Category">
                <select value={form.subsection} onChange={set('subsection')}>
                  {businessSubs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </Field>
            </div>
          )}
          {isBooks && (
            <div style={{ flex: 1, minWidth: 140 }}>
              <Field label="Type">
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {['non-fiction','fiction'].map(t => (
                    <button key={t} onClick={() => { setForm(f => ({ ...f, fiction_nonfiction: t })); schedSave({ ...form, fiction_nonfiction: t }); }} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 99, fontWeight: 700, background: form.fiction_nonfiction === t ? 'var(--clay)' : 'var(--sage-pale)', color: form.fiction_nonfiction === t ? '#fff' : 'var(--text-mid)', border: '1.5px solid', borderColor: form.fiction_nonfiction === t ? 'var(--clay)' : 'var(--border)' }}>
                      {t === 'non-fiction' ? 'Non-Fiction' : 'Fiction'}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}
        </div>

        {/* Book syntopic pairings */}
        {isBooks && (
          <div className="form-field" style={{ marginBottom: 20 }}>
            <label className="form-label">Syntopic Pairings</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {pairings.length === 0
                ? <span style={{ fontSize: 13, color: 'var(--text-light)', fontStyle: 'italic' }}>—</span>
                : pairings.map(id => {
                  const book = allBooks.find(b => b.id === id);
                  return book ? (
                    <span key={id} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: 'var(--clay-pale)', color: 'var(--clay)', fontStyle: 'italic', cursor: 'pointer' }} onClick={() => togglePairing(id)}>
                      {book.title} {book.author ? `by ${book.author}` : ''} ×
                    </span>
                  ) : null;
                })
              }
            </div>
            <div style={{ position: 'relative' }}>
              <button className="btn-outline" onClick={() => setShowPairingDropdown(v => !v)} style={{ fontSize: 12 }}>
                {showPairingDropdown ? '▲ Close' : '▼ Pair with books…'}
              </button>
              {showPairingDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: 200, overflowY: 'auto', background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', zIndex: 10, marginTop: 2, boxShadow: 'var(--shadow-md)' }}>
                  {allBooks.filter(b => !fullEntry || b.id !== fullEntry.id).map(book => (
                    <label key={book.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <input type="checkbox" checked={pairings.includes(book.id)} onChange={() => togglePairing(book.id)} style={{ width: 'auto' }} />
                      <span style={{ fontStyle: 'italic' }}>{book.title}{book.author ? ` by ${book.author}` : ''}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Author */}
        {['books','wisdom','articles','documentaries'].includes(effectiveSection) && (
          <Field label={effectiveSection === 'wisdom' ? 'Author / Source (optional)' : 'Author'}>
            <input type="text" value={form.author} onChange={set('author')} placeholder="Author name…" />
          </Field>
        )}

        {/* Section-specific fields */}
        {effectiveSection === 'vocabulary' && (
          <>
            <Field label="Definition"><textarea value={form.definition} onChange={set('definition')} placeholder="What does it mean?" rows={3} /></Field>
            <Field label="Examples">
              <div className="callout clay"><textarea value={form.examples} onChange={set('examples')} placeholder="Usage examples…" rows={3} /></div>
            </Field>
            <Field label="How I came across it">
              <div className="callout sage"><textarea value={form.how_came_across} onChange={set('how_came_across')} placeholder="Where did you encounter this word?" rows={2} /></div>
            </Field>
          </>
        )}

        {effectiveSection === 'wisdom' && (
          <>
            <Field label="Quote or Lesson">
              <textarea value={form.body} onChange={set('body')} placeholder="The wisdom…" rows={5} style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 16 }} />
            </Field>
            <hr className="divider" />
            <Field label="Personal Reflection"><textarea value={form.reflection} onChange={set('reflection')} placeholder="Your thoughts…" rows={4} /></Field>
          </>
        )}

        {richTextSections.includes(effectiveSection) && (
          <Field label="Notes">
            <TipTapEditor key={editorKey.current} content={form.body} onChange={setRich('body')} placeholder="Start writing…" minHeight={effectiveSection === 'deep-dives' ? 360 : 240} />
          </Field>
        )}

        {['books','podcasts','videos','articles','documentaries'].includes(effectiveSection) && (
          <Field label="Notes">
            <textarea value={form.body} onChange={set('body')} placeholder="Your notes…" rows={8} style={{ fontFamily: 'var(--font-serif)' }} />
          </Field>
        )}

        {['podcasts','videos','articles','documentaries'].includes(effectiveSection) && (
          <Field label="Link">
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="url" value={form.link} onChange={set('link')} placeholder="https://…" />
              {form.link && <button onClick={() => openLink(form.link)} style={{ flexShrink: 0, fontSize: 12, padding: '6px 12px', borderRadius: 'var(--radius)', background: 'var(--sage-pale)', color: 'var(--sage-dark)', border: '1px solid var(--border)' }}>Open ↗</button>}
            </div>
          </Field>
        )}

        <Field label="Tags">
          <TagInput tags={form.tags} allTags={allTags} onChange={tags => { setForm(f => ({ ...f, tags })); schedSave({ ...form, tags }); }} />
        </Field>

        {fullEntry && effectiveSection !== 'deep-dives' && (
          <ImageGallery entryId={fullEntry.id} images={fullEntry.images || []} onRefresh={load} />
        )}

        {isNew && (
          <div style={{ marginTop: 20 }}>
            <button className="btn-primary" onClick={handleCreate} disabled={saving || !form.title.trim()} style={{ padding: '10px 28px' }}>
              {saving ? 'Creating…' : 'Create Entry'}
            </button>
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          message={`Delete "${fullEntry?.title}"?`}
          detail="This cannot be undone."
          onConfirm={() => { setConfirm(false); handleDelete(); }}
          onCancel={() => setConfirm(false)}
        />
      )}
    </main>
  );
}
