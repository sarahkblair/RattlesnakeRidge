import React, { useEffect } from 'react';

interface ModalProps {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number | string;
}

export function Modal({ title, onClose, children, width = 480 }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1a100a',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 12,
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 24,
        }}
      >
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 20, fontWeight: 700, color: '#f0ead6' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{ color: 'rgba(255,255,255,0.5)', fontSize: 20, padding: 4, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
