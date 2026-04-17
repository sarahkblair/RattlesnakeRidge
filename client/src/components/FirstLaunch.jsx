import React, { useState } from 'react';
import { api } from '../utils/api.js';

const STEPS = ['welcome', 'tag', 'learn', 'media', 'done'];

export default function FirstLaunch({ onComplete, onRefreshTags }) {
  const [step, setStep] = useState(0);
  const [tagName, setTagName] = useState('');
  const [learnTitle, setLearnTitle] = useState('');
  const [learnDef, setLearnDef] = useState('');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaAuthor, setMediaAuthor] = useState('');
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));

  async function handleTagSubmit() {
    if (!tagName.trim()) return;
    setSaving(true);
    await api.createTag(tagName.trim());
    await onRefreshTags();
    setSaving(false);
    next();
  }

  async function handleLearnSubmit() {
    if (!learnTitle.trim()) return;
    setSaving(true);
    await api.createEntry({
      section: 'vocabulary',
      title: learnTitle.trim(),
      definition: learnDef.trim(),
      tags: tagName ? [tagName.trim()] : []
    });
    setSaving(false);
    next();
  }

  async function handleMediaSubmit() {
    if (!mediaTitle.trim()) return;
    setSaving(true);
    await api.createEntry({
      section: 'books',
      title: mediaTitle.trim(),
      author: mediaAuthor.trim(),
      status: 'not-consumed',
      tags: tagName ? [tagName.trim()] : []
    });
    setSaving(false);
    next();
  }

  const containerStyle = {
    maxWidth: 520,
    width: '100%',
    background: 'var(--card)',
    borderRadius: 16,
    boxShadow: 'var(--shadow-md)',
    padding: '48px 48px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24
  };

  const stepIndicator = (
    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{
          height: 3,
          flex: 1,
          borderRadius: 99,
          background: i <= step ? 'var(--clay)' : 'var(--border)',
          transition: 'background 300ms'
        }} />
      ))}
    </div>
  );

  if (current === 'welcome') return (
    <div className="first-launch">
      <div style={containerStyle}>
        {stepIndicator}
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <h1 style={{ fontSize: '2.2rem', letterSpacing: '0.14em', color: 'var(--clay)', textTransform: 'uppercase', marginBottom: 12 }}>
            Sarah's Brain
          </h1>
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--text-mid)', lineHeight: 1.7 }}>
            Your personal library of everything you're learning.
          </p>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-light)', textAlign: 'center', lineHeight: 1.7 }}>
          Let's set up your library in just three quick steps — a tag, a vocabulary word, and a book.
        </p>
        <button className="btn-primary" onClick={next} style={{ alignSelf: 'center', padding: '10px 32px', fontSize: 14 }}>
          Let's Begin →
        </button>
      </div>
    </div>
  );

  if (current === 'tag') return (
    <div className="first-launch">
      <div style={containerStyle}>
        {stepIndicator}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: 6 }}>Step 1 of 3</div>
          <h2 style={{ marginBottom: 8 }}>Create your first tag</h2>
          <p style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.6 }}>Tags connect everything in your library across sections. What's a topic you're exploring right now?</p>
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label>Tag name</label>
          <input
            type="text"
            value={tagName}
            onChange={e => setTagName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTagSubmit()}
            placeholder="e.g. philosophy, stoicism, ranching…"
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          <button className="btn-ghost" onClick={next} style={{ fontSize: 13 }}>Skip</button>
          <button className="btn-primary" onClick={handleTagSubmit} disabled={saving || !tagName.trim()} style={{ fontSize: 13 }}>
            {saving ? 'Saving…' : 'Create Tag →'}
          </button>
        </div>
      </div>
    </div>
  );

  if (current === 'learn') return (
    <div className="first-launch">
      <div style={containerStyle}>
        {stepIndicator}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: 6 }}>Step 2 of 3</div>
          <h2 style={{ marginBottom: 8 }}>Add a vocabulary word</h2>
          <p style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.6 }}>Start your collection with a word you've recently encountered or love.</p>
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label>Word</label>
          <input type="text" value={learnTitle} onChange={e => setLearnTitle(e.target.value)} placeholder="e.g. liminal, sonder, perseverate…" autoFocus />
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label>Definition (optional)</label>
          <textarea value={learnDef} onChange={e => setLearnDef(e.target.value)} placeholder="What does it mean?" rows={3} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          <button className="btn-ghost" onClick={next} style={{ fontSize: 13 }}>Skip</button>
          <button className="btn-primary" onClick={handleLearnSubmit} disabled={saving || !learnTitle.trim()} style={{ fontSize: 13 }}>
            {saving ? 'Saving…' : 'Add Word →'}
          </button>
        </div>
      </div>
    </div>
  );

  if (current === 'media') return (
    <div className="first-launch">
      <div style={containerStyle}>
        {stepIndicator}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: 6 }}>Step 3 of 3</div>
          <h2 style={{ marginBottom: 8 }}>Add a book</h2>
          <p style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.6 }}>What book are you reading right now — or planning to read?</p>
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label>Title</label>
          <input type="text" value={mediaTitle} onChange={e => setMediaTitle(e.target.value)} placeholder="Book title…" autoFocus />
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label>Author (optional)</label>
          <input type="text" value={mediaAuthor} onChange={e => setMediaAuthor(e.target.value)} placeholder="Author name…" />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          <button className="btn-ghost" onClick={next} style={{ fontSize: 13 }}>Skip</button>
          <button className="btn-primary" onClick={handleMediaSubmit} disabled={saving || !mediaTitle.trim()} style={{ fontSize: 13 }}>
            {saving ? 'Saving…' : 'Add Book →'}
          </button>
        </div>
      </div>
    </div>
  );

  // Done
  return (
    <div className="first-launch">
      <div style={{ ...containerStyle, textAlign: 'center', gap: 20 }}>
        {stepIndicator}
        <div style={{ fontSize: 48 }}>🌵</div>
        <div>
          <h2 style={{ marginBottom: 8 }}>Your library is ready.</h2>
          <p style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.7 }}>
            Everything you learn, in one beautiful place. Add entries any time from any section.
          </p>
        </div>
        <button className="btn-primary" onClick={onComplete} style={{ alignSelf: 'center', padding: '10px 32px', fontSize: 14 }}>
          Open My Library →
        </button>
      </div>
    </div>
  );
}
