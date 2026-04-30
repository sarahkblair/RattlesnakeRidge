import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import ConfirmDialog from '../ConfirmDialog.jsx';

function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', padding: '12px 14px', boxShadow: 'var(--shadow)', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{product.name}</div>
        {product.brand && <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{product.brand}</div>}
        {product.notes && <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4, fontStyle: 'italic' }}>{product.notes}</div>}
        <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: product.frequency === 'daily' ? 'var(--sage-pale)' : 'var(--clay-pale)', color: product.frequency === 'daily' ? 'var(--sage-dark)' : 'var(--clay)' }}>
          {product.frequency === 'daily' ? 'Daily' : 'As Needed'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button onClick={() => onEdit(product)} className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }}>Edit</button>
        <button onClick={() => onDelete(product)} className="btn-danger btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }}>✕</button>
      </div>
    </div>
  );
}

function ProductForm({ product, routine, onSave, onCancel }) {
  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [notes, setNotes] = useState(product?.notes || '');
  const [frequency, setFrequency] = useState(product?.frequency || 'daily');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = { name, brand, notes, frequency, routine };
      if (product?.id) { await api.updateProduct(product.id, data); }
      else { await api.addProduct(data); }
      onSave();
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  return (
    <div style={{ padding: 16, background: 'var(--card)', borderRadius: 'var(--radius)', border: '1.5px solid var(--clay-light)', marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Product name*" style={{ flex: 2, fontSize: 13 }} />
        <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Brand (optional)" style={{ flex: 1, fontSize: 13 }} />
      </div>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} style={{ fontSize: 13, marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={frequency} onChange={e => setFrequency(e.target.value)} style={{ fontSize: 13, flex: 1 }}>
          <option value="daily">Daily</option>
          <option value="as-needed">As Needed</option>
        </select>
        <button className="btn-primary" onClick={handleSave} disabled={saving || !name.trim()} style={{ fontSize: 12 }}>{saving ? 'Saving…' : 'Save'}</button>
        <button className="btn-ghost" onClick={onCancel} style={{ fontSize: 12 }}>Cancel</button>
      </div>
    </div>
  );
}

function RoutineColumn({ routine, label, accent, products, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <div style={{ flex: 1, minWidth: 260 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${accent}` }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: accent }}>{label}</span>
        <button onClick={() => setAdding(true)} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: accent, color: '#fff', border: 'none' }}>+ Add</button>
      </div>
      {adding && <ProductForm routine={routine} onSave={() => { setAdding(false); onRefresh(); }} onCancel={() => setAdding(false)} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {products.map(p => (
          <div key={p.id}>
            {editing?.id === p.id
              ? <ProductForm product={p} routine={routine} onSave={() => { setEditing(null); onRefresh(); }} onCancel={() => setEditing(null)} />
              : <ProductCard product={p} onEdit={setEditing} onDelete={setConfirmDelete} />}
          </div>
        ))}
        {products.length === 0 && !adding && <div style={{ fontSize: 13, color: 'var(--text-light)', fontStyle: 'italic', padding: '12px 0' }}>No products yet.</div>}
      </div>
      {confirmDelete && (
        <ConfirmDialog
          message={`Remove "${confirmDelete.name}"?`}
          detail="This cannot be undone."
          onConfirm={async () => { await api.deleteProduct(confirmDelete.id); setConfirmDelete(null); onRefresh(); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

export default function BeautyTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setProducts(await api.getBeauty()); } catch (e) {}
    setLoading(false);
  }

  const morning = products.filter(p => p.routine === 'morning');
  const evening = products.filter(p => p.routine === 'evening');

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-light)', fontStyle: 'italic', padding: 40 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <RoutineColumn routine="morning" label="☀️ Morning Routine" accent="var(--clay)" products={morning} onRefresh={load} />
          <RoutineColumn routine="evening" label="🌙 Evening Routine" accent="var(--sage-dark)" products={evening} onRefresh={load} />
        </div>
      )}
    </div>
  );
}
