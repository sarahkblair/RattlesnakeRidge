import React, { useState } from 'react';
import { api } from '../utils/api.js';

const TYPES = [
  { id: 'vocabulary', label: 'Vocabulary Word', fields: ['word', 'definition'] },
  { id: 'wisdom', label: 'Wisdom Quote', fields: ['quote', 'author'] },
  { id: 'thought', label: 'Quick Thought', fields: ['title', 'body'] },
];

export default function QuickAdd({ onClose, allTags, onRefresh }) {
  const [type, setType] = useState('vocabulary');
  const [form, setForm] = useState({ word: '', definition: '', quote: '', author: '', title: '', body: '' });
  const [saving, setSaving] = useState(false);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (type === 'vocabulary') {
        await api.createEntry({ section: 'vocabulary', title: form.word, definition: form.definition });
      } else if (type === 'wisdom') {
        await api.createEntry({ section: 'wisdom', title: form.quote.slice(0, 60) + '…', body: form.quote, author: form.author });
      } else {
        await api.createEntry({ section: 'deep-dives', title: form.title, body: form.body });
      }
      onRefresh?.();
      onClose();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Quick Add</h3>
          <button onClick={onClose} style={{ fontSize: 22, color: 'var(--text-light)' }}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {TYPES.map(t => (
              <button key={t.id} className={`nav-pill${type === t.id ? ' active' : ''}`} onClick={() => setType(t.id)}>{t.label}</button>
            ))}
          </div>

          {type === 'vocabulary' && (
            <>
              <div className="form-field"><label className="form-label">Word</label><input value={form.word} onChange={set('word')} placeholder="The word…" autoFocus /></div>
              <div className="form-field"><label className="form-label">Definition</label><textarea value={form.definition} onChange={set('definition')} placeholder="What does it mean?" rows={3} /></div>
            </>
          )}
          {type === 'wisdom' && (
            <>
              <div className="form-field"><label className="form-label">Quote or lesson</label><textarea value={form.quote} onChange={set('quote')} placeholder="The wisdom…" rows={4} style={{ fontStyle: 'italic', fontFamily: 'var(--font-serif)' }} autoFocus /></div>
              <div className="form-field"><label className="form-label">Author (optional)</label><input value={form.author} onChange={set('author')} placeholder="Who said it?" /></div>
            </>
          )}
          {type === 'thought' && (
            <>
              <div className="form-field"><label className="form-label">Title</label><input value={form.title} onChange={set('title')} placeholder="Title…" autoFocus /></div>
              <div className="form-field"><label className="form-label">Notes</label><textarea value={form.body} onChange={set('body')} placeholder="Your thought…" rows={4} /></div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Add to Library'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
