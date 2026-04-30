import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api.js';
import ConfirmDialog from '../ConfirmDialog.jsx';

function PersonalShopper() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.getShopperHistory().then(setHistory).catch(() => {}); }, []);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      const data = await api.aiShopper(query);
      setResults(data);
      api.getShopperHistory().then(setHistory).catch(() => {});
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const openLink = url => {
    if (!url) return;
    if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url);
    else window.open(url, '_blank', 'noopener');
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 12 }}>Personal Shopper</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Ask Claude to find something… e.g. 'wide-leg linen pants under $100'" style={{ flex: 1, fontSize: 14 }} />
        <button className="btn-primary" onClick={handleSearch} disabled={loading || !query.trim()} style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
          {loading ? 'Searching…' : '✦ Find'}
        </button>
      </div>
      {history.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {history.map((h, i) => (
            <button key={i} onClick={() => setQuery(h.query)} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--sage-pale)', color: 'var(--sage-dark)', border: '1px solid var(--border)' }}>{h.query}</button>
          ))}
        </div>
      )}
      {loading && <div style={{ textAlign: 'center', color: 'var(--text-light)', fontStyle: 'italic', padding: 20 }}>Claude is searching…</div>}
      {results?.items && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {results.items.map((item, i) => (
            <div key={i} style={{ background: 'var(--card)', borderRadius: 'var(--radius)', padding: 14, boxShadow: 'var(--shadow)', border: '1.5px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{item.name}</div>
              {item.brand && <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 4 }}>{item.brand}</div>}
              {item.price && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--clay)', marginBottom: 6 }}>{item.price}</div>}
              {item.description && <div style={{ fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 8 }}>{item.description}</div>}
              {item.url && <button onClick={() => openLink(item.url)} style={{ fontSize: 11, color: 'var(--clay)', padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}>Shop ↗</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WishlistSection() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ name: '', brand: '', price: '', url: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.getWishlistCategories().then(cats => { setCategories(cats); if (cats.length) setActiveCategory(cats[0].id); }).catch(() => {}); }, []);
  useEffect(() => { if (activeCategory) api.getWishlist({ category_id: activeCategory }).then(setItems).catch(() => {}); }, [activeCategory]);

  const resetForm = () => setForm({ name: '', brand: '', price: '', url: '', notes: '' });

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const data = { ...form, category_id: activeCategory };
      if (editItem?.id) { await api.updateWishlistItem(editItem.id, data); }
      else { await api.addWishlistItem(data); }
      api.getWishlist({ category_id: activeCategory }).then(setItems);
      resetForm(); setAdding(false); setEditItem(null);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  function startEdit(item) {
    setEditItem(item);
    setForm({ name: item.name || '', brand: item.brand || '', price: item.price || '', url: item.url || '', notes: item.notes || '' });
    setAdding(true);
  }

  const openLink = url => {
    if (!url) return;
    if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url);
    else window.open(url, '_blank', 'noopener');
  };

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 12 }}>Wishlist</div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 700, background: activeCategory === cat.id ? 'var(--clay)' : 'transparent', color: activeCategory === cat.id ? '#fff' : 'var(--text-light)', border: `1px solid ${activeCategory === cat.id ? 'var(--clay)' : 'var(--border)'}` }}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Add/edit form */}
      {adding && (
        <div style={{ padding: 14, background: 'var(--card)', borderRadius: 'var(--radius)', border: '1.5px solid var(--clay-light)', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Item name*" style={{ flex: 2, minWidth: 140, fontSize: 13 }} />
            <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Brand" style={{ flex: 1, minWidth: 100, fontSize: 13 }} />
            <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Price" style={{ width: 80, fontSize: 13 }} />
          </div>
          <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="URL" style={{ marginBottom: 8, fontSize: 13 }} />
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" rows={2} style={{ fontSize: 13, marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()} style={{ fontSize: 12 }}>{saving ? 'Saving…' : 'Save'}</button>
            <button className="btn-ghost" onClick={() => { setAdding(false); setEditItem(null); resetForm(); }} style={{ fontSize: 12 }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button onClick={() => { setAdding(true); setEditItem(null); resetForm(); }} className="btn-outline" style={{ fontSize: 12 }}>+ Add Item</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: 'var(--card)', borderRadius: 'var(--radius)', padding: 12, boxShadow: 'var(--shadow)', border: '1.5px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{item.name}</div>
            {item.brand && <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{item.brand}</div>}
            {item.price && <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--clay)', marginTop: 4 }}>{item.price}</div>}
            {item.notes && <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 4, fontStyle: 'italic' }}>{item.notes}</div>}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {item.url && <button onClick={() => openLink(item.url)} style={{ fontSize: 11, color: 'var(--clay)', padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}>Shop ↗</button>}
              <button onClick={() => startEdit(item)} className="btn-ghost" style={{ fontSize: 11, padding: '2px 6px', marginLeft: 'auto' }}>Edit</button>
              <button onClick={() => setConfirmDelete(item)} className="btn-danger btn-ghost" style={{ fontSize: 11, padding: '2px 6px' }}>✕</button>
            </div>
          </div>
        ))}
        {items.length === 0 && !adding && <div style={{ fontSize: 13, color: 'var(--text-light)', fontStyle: 'italic', padding: '12px 0' }}>Nothing on the wishlist yet.</div>}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          message={`Remove "${confirmDelete.name}"?`}
          detail="This cannot be undone."
          onConfirm={async () => { await api.deleteWishlistItem(confirmDelete.id); api.getWishlist({ category_id: activeCategory }).then(setItems); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

export default function StyleTab() {
  const [view, setView] = useState('shopper');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', gap: 4, padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--panel)', flexShrink: 0 }}>
        {[['shopper','✦ Personal Shopper'],['wishlist','Wishlist']].map(([v, lbl]) => (
          <button key={v} onClick={() => setView(v)} style={{ fontSize: 12, padding: '4px 14px', borderRadius: 99, fontWeight: 700, background: view === v ? 'var(--clay)' : 'transparent', color: view === v ? '#fff' : 'var(--text-light)', border: `1px solid ${view === v ? 'var(--clay)' : 'var(--border)'}` }}>
            {lbl}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {view === 'shopper' ? <PersonalShopper /> : <WishlistSection />}
      </div>
    </div>
  );
}
