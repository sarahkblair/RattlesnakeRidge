import React, { useState } from 'react';
import { apiPost } from '../../api';
import { Btn, Input } from './FormFields';

interface Props {
  onAuthenticated: () => void;
}

export function AuthGate({ onAuthenticated }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiPost('/auth/login', { password });
      onAuthenticated();
    } catch {
      setError('Wrong password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#100806',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 16,
        padding: 40,
        width: '100%',
        maxWidth: 380,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
        <h1 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 26,
          fontWeight: 700,
          color: '#f0ead6',
          marginBottom: 4,
        }}>
          Rattlesnake Ridge
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 32 }}>
          Homestead Hub
        </p>
        <form onSubmit={handleSubmit}>
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            style={{ textAlign: 'center', fontSize: 16, marginBottom: 16 }}
          />
          {error && (
            <p style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{error}</p>
          )}
          <Btn
            type="submit"
            disabled={loading || !password}
            style={{ width: '100%', padding: '10px 18px', fontSize: 15 }}
            accent="#4ade80"
          >
            {loading ? 'Checking...' : 'Enter →'}
          </Btn>
        </form>
      </div>
    </div>
  );
}
