import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function FavoritesManager({ onClose }) {
  const [data, setData] = useState({ categories: [], uncategorized: [] });
  const [newCat, setNewCat] = useState('');
  const [adding, setAdding] = useState(null); // { categoryId }
  const [addForm, setAddForm] = useState({ name: '', url: '', category_id: '' });
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    const d = await api.getFavorites();
    setData(d);
  };
  useEffect(() => { load(); }, []);

  const openLink = url => {
    if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url);
    else window.open(url, '_blank', 'noopener');
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    await api.addFavoriteCategory(newCat.trim());
    setNewCat('');
    load();
  };

  const addSite = async () => {
    if (!addForm.name || !addForm.url) return;
    await api.addFavorite({ name: addForm.name, url: addForm.url, category_id: addForm.category_id || null });
    setAdding(null);
    setAddForm({ name: '', url: '', category_id: '' });
    load();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: '92vw', maxWidth: 700, maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'slideUp 180ms ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2>Favorites</h2>
          <button onClick={onClose} style={{ fontSize: 22, color: 'var(--text-light)' }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: 24 }}>
          {/* Add category */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} placeholder="New category name…" style={{ flex: 1 }} />
            <button className="btn-primary" onClick={addCategory} style={{ fontSize: 13 }}>Add Category</button>
          </div>

          {data.categories.map(cat => (
            <div key={cat.id} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 style={{ fontSize: 14, color: 'var(--text-mid)' }}>{cat.name}</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { setAdding({ categoryId: cat.id }); setAddForm(f => ({ ...f, category_id: cat.id })); }}>+ Add Site</button>
                  <button className="btn-danger btn-ghost" style={{ fontSize: 12 }} onClick={() => setConfirm({ msg: `Delete "${cat.name}" and all its sites?`, onConfirm: async () => { await api.deleteFavoriteCategory(cat.id); setConfirm(null); load(); } })}>×</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {cat.sites.map(site => (
                  <button key={site.id} onClick={() => openLink(site.url)} style={{ background: 'var(--sage-pale)', color: 'var(--sage-dark)', padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    {site.name}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Add site form */}
          {adding && (
            <div style={{ background: 'var(--panel)', borderRadius: 'var(--radius)', padding: 16, marginTop: 8 }}>
              <div style={{ marginBottom: 10, fontWeight: 600, fontSize: 13 }}>Add a site</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input placeholder="Site name" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 1 }} />
                <input placeholder="https://…" value={addForm.url} onChange={e => setAddForm(f => ({ ...f, url: e.target.value }))} style={{ flex: 2 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={addForm.category_id} onChange={e => setAddForm(f => ({ ...f, category_id: e.target.value }))} style={{ flex: 1 }}>
                  <option value="">No category</option>
                  {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="btn-primary" onClick={addSite} style={{ fontSize: 13 }}>Add</button>
                <button className="btn-ghost" onClick={() => setAdding(null)} style={{ fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          )}

          {!adding && (
            <button className="btn-outline" onClick={() => { setAdding(true); setAddForm({ name: '', url: '', category_id: '' }); }} style={{ fontSize: 13, marginTop: 8 }}>+ Add Site</button>
          )}
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          message={confirm.msg}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
