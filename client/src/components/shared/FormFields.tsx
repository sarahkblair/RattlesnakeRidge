import React from 'react';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 6,
  color: '#f0ead6',
  fontSize: 14,
  fontFamily: 'Lora, Georgia, serif',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'rgba(255,255,255,0.6)',
  marginBottom: 4,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input style={inputStyle} {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select style={{ ...inputStyle, cursor: 'pointer' }} {...props} />
  );
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  accent?: string;
}

export function Btn({ variant = 'primary', accent, style, children, ...props }: BtnProps) {
  const base: React.CSSProperties = {
    padding: '8px 18px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'Lora, Georgia, serif',
    transition: 'opacity 0.15s',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.5 : 1,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: accent || '#c2541c', color: '#fff', border: 'none' },
    secondary: { background: 'rgba(255,255,255,0.1)', color: '#f0ead6', border: '1px solid rgba(255,255,255,0.2)' },
    danger: { background: '#7f1d1d', color: '#fca5a5', border: 'none' },
    ghost: { background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)' },
  };

  return (
    <button style={{ ...base, ...variants[variant], ...style }} {...props}>
      {children}
    </button>
  );
}

export function Spinner({ size = 20, color = '#f0ead6' }: { size?: number; color?: string }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid rgba(255,255,255,0.2)`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}
