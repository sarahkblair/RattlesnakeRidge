import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api.js';
import TipTapEditor from '../TipTapEditor.jsx';
import ConfirmDialog from '../ConfirmDialog.jsx';

function VisionCardDetail({ card, onBack, onRefresh }) {
  const [form, setForm] = useState({ title: card.title || '', notes: card.notes || '' });
  const [images, setImages] = useState(card.images || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmImgDelete, setConfirmImgDelete] = useState(null);
  const fileRef = useRef(null);
  const saveTimer = useRef(null);
  const editorKey = useRef(0);

  useEffect(() => {
    setForm({ title: card.title || '', notes: card.notes || '' });
    setImages(card.images || []);
    editorKey.current++;
  }, [card.id]);

  function schedSave(data) {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(data), 1400);
  }

  async function doSave(data = form) {
    setSaving(true);
    try {
      await api.updateVisionCard(card.id, data);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
      onRefresh();
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await api.addVisionImage(card.id, file);
      setImages(imgs => [...imgs, res]);
    } catch (e) { console.error(e); }
    e.target.value = '';
  }

  async function handleDeleteImage(img) {
    await api.deleteVisionImage(card.id, img.id);
    setImages(imgs => imgs.filter(i => i.id !== img.id));
  }

  async function handleDeleteCard() {
    await api.deleteVisionCard(card.id);
    onBack(); onRefresh();
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', padding: '20px 26px', maxWidth: 820 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button className="btn-ghost" onClick={onBack} style={{ fontSize: 13 }}>← Back</button>
        {saving && <span style={{ fontSize: 11, color: 'var(--text-light)', fontStyle: 'italic' }}>Saving…</span>}
        {saved && <span style={{ fontSize: 11, color: 'var(--sage-mid)', fontStyle: 'italic' }}>✓ Saved</span>}
        <button className="btn-danger btn-ghost" onClick={() => setConfirmDelete(true)} style={{ fontSize: 13, marginLeft: 'auto' }}>Delete</button>
      </div>

      <input
        type="text"
        value={form.title}
        onChange={e => { setForm(f => ({ ...f, title: e.target.value })); schedSave({ ...form, title: e.target.value }); }}
        placeholder="Vision title…"
        style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, background: 'transparent', border: 'none', borderBottom: '2px solid var(--border)', borderRadius: 0, padding: '4px 0', marginBottom: 20, width: '100%' }}
      />

      {/* Image gallery */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Images</span>
          <button onClick={() => fileRef.current?.click()} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'var(--clay)', color: '#fff', border: 'none' }}>+ Add Image</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {images.map(img => (
            <div key={img.id} style={{ position: 'relative', width: 120, height: 120, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1.5px solid var(--border)' }}>
              <img src={`/uploads/${img.filename}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                onClick={() => setConfirmImgDelete(img)}
                style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
              >×</button>
            </div>
          ))}
          {images.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-light)', fontStyle: 'italic' }}>No images yet.</div>}
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Notes</label>
        <TipTapEditor
          key={editorKey.current}
          content={form.notes}
          onChange={html => { setForm(f => ({ ...f, notes: html })); schedSave({ ...form, notes: html }); }}
          placeholder="Write your vision, intentions, or reflections…"
          minHeight={280}
        />
      </div>

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${card.title}"?`}
          detail="This cannot be undone."
          onConfirm={() => { setConfirmDelete(false); handleDeleteCard(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {confirmImgDelete && (
        <ConfirmDialog
          message="Delete this image?"
          detail="This cannot be undone."
          onConfirm={() => { handleDeleteImage(confirmImgDelete); setConfirmImgDelete(null); }}
          onCancel={() => setConfirmImgDelete(null)}
        />
      )}
    </div>
  );
}

function VisionGrid({ cards, onSelect, onNew }) {
  const fileRef = useRef(null);

  async function handleNewWithImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    fd.append('title', 'New Vision');
    try { const card = await api.createVisionCard(fd); onSelect(card); }
    catch (err) { console.error(err); }
    e.target.value = '';
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className="btn-primary" onClick={onNew} style={{ fontSize: 13 }}>+ New Card</button>
        <button className="btn-outline" onClick={() => fileRef.current?.click()} style={{ fontSize: 13 }}>+ From Image</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleNewWithImage} />
      </div>

      {cards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-light)', fontStyle: 'italic' }}>
          Your vision board is empty. Create your first card.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {cards.map(card => {
            const primaryImage = card.images?.[0];
            return (
              <button
                key={card.id}
                onClick={() => onSelect(card)}
                style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: '1.5px solid var(--border)', textAlign: 'left', padding: 0, cursor: 'pointer', transition: 'transform 150ms ease, box-shadow 150ms ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              >
                {primaryImage ? (
                  <img src={`/uploads/${primaryImage.filename}`} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: 140, background: 'var(--sage-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: 28 }}>✦</div>
                )}
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 13, color: 'var(--text-dark)', marginBottom: 2 }}>{card.title || 'Untitled'}</div>
                  {card.images?.length > 1 && <div style={{ fontSize: 10, color: 'var(--text-light)' }}>{card.images.length} images</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function VisionTab() {
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setCards(await api.getVisionCards()); } catch (e) {}
    setLoading(false);
  }

  async function handleNew() {
    const fd = new FormData();
    fd.append('title', 'New Vision');
    try {
      const card = await api.createVisionCard(fd);
      await load();
      setSelected(card);
    } catch (e) { console.error(e); }
  }

  async function handleSelectCard(card) {
    try {
      const full = await api.getVisionCard(card.id);
      setSelected(full);
    } catch (e) { setSelected(card); }
  }

  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text-light)', fontStyle: 'italic', padding: 40 }}>Loading…</div>;

  if (selected) {
    return (
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <VisionCardDetail
          card={selected}
          onBack={() => setSelected(null)}
          onRefresh={async () => {
            await load();
            const updated = await api.getVisionCard(selected.id).catch(() => null);
            if (updated) setSelected(updated);
          }}
        />
      </div>
    );
  }

  return <VisionGrid cards={cards} onSelect={handleSelectCard} onNew={handleNew} />;
}
