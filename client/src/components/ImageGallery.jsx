import React, { useRef } from 'react';
import { api } from '../utils/api.js';

export default function ImageGallery({ entryId, images, onRefresh }) {
  const inputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await api.uploadImage(entryId, file);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
    e.target.value = '';
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Remove this image?')) return;
    await api.deleteImage(entryId, imageId);
    onRefresh();
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
        textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 10
      }}>
        Images
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {images.map(img => (
          <div key={img.id} style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', width: 120, height: 90 }}>
            <img
              src={`/uploads/${entryId}/${img.filename}`}
              alt={img.original_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <button
              onClick={() => handleDelete(img.id)}
              style={{
                position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)',
                color: '#fff', borderRadius: '50%', width: 20, height: 20, fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', lineHeight: 1
              }}
            >×</button>
          </div>
        ))}

        <button
          onClick={() => inputRef.current?.click()}
          style={{
            width: 80, height: 60, borderRadius: 'var(--radius)',
            border: '2px dashed var(--border)', background: 'var(--sage-pale)',
            color: 'var(--text-light)', fontSize: 24, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Upload image"
        >
          +
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </div>
    </div>
  );
}
