import React, { useState } from 'react';
import { api } from '../utils/api.js';

const STEPS = ['welcome', 'tag', 'vocab', 'book', 'spotify', 'period', 'vision', 'done'];

const containerStyle = {
  maxWidth: 520, width: '100%', background: 'var(--card)', borderRadius: 16,
  boxShadow: 'var(--shadow-md)', padding: '44px 44px 36px',
  display: 'flex', flexDirection: 'column', gap: 22,
};

function StepIndicator({ step, total }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ height: 3, flex: 1, borderRadius: 99, background: i <= step ? 'var(--clay)' : 'var(--border)', transition: 'background 300ms' }} />
      ))}
    </div>
  );
}

export default function FirstLaunch({ onComplete, onRefreshTags }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step data
  const [tagName, setTagName] = useState('');
  const [vocabWord, setVocabWord] = useState('');
  const [vocabDef, setVocabDef] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [periodDate, setPeriodDate] = useState('');
  const [visionTitle, setVisionTitle] = useState('');

  const current = STEPS[step];
  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));

  async function handleTagSubmit() {
    if (!tagName.trim()) { next(); return; }
    setSaving(true);
    await api.createTag(tagName.trim()).catch(() => {});
    await onRefreshTags().catch(() => {});
    setSaving(false);
    next();
  }

  async function handleVocabSubmit() {
    if (!vocabWord.trim()) { next(); return; }
    setSaving(true);
    await api.createEntry({ section: 'vocabulary', title: vocabWord.trim(), definition: vocabDef.trim(), tags: tagName.trim() ? [tagName.trim()] : [] }).catch(() => {});
    setSaving(false);
    next();
  }

  async function handleBookSubmit() {
    if (!bookTitle.trim()) { next(); return; }
    setSaving(true);
    await api.createEntry({ section: 'books', title: bookTitle.trim(), author: bookAuthor.trim(), status: 'not-consumed' }).catch(() => {});
    setSaving(false);
    next();
  }

  async function handlePeriodSubmit() {
    if (!periodDate) { next(); return; }
    setSaving(true);
    await api.addPeriod({ start_date: periodDate }).catch(() => {});
    setSaving(false);
    next();
  }

  async function handleVisionSubmit() {
    if (!visionTitle.trim()) { next(); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append('title', visionTitle.trim());
    await api.createVisionCard(fd).catch(() => {});
    setSaving(false);
    next();
  }

  const Skip = () => <button className="btn-ghost" onClick={next} style={{ fontSize: 13 }}>Skip</button>;

  if (current === 'welcome') return (
    <div className="first-launch">
      <div style={containerStyle}>
        <StepIndicator step={step} total={STEPS.length} />
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <h1 style={{ fontSize: '2.2rem', letterSpacing: '0.12em', color: 'var(--clay)', textTransform: 'uppercase', marginBottom: 12 }}>Sarah's Brain</h1>
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.05rem', color: 'var(--text-mid)', lineHeight: 1.7 }}>
            Your full life operating system — learning, training, wellness, and vision.
          </p>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-light)', textAlign: 'center', lineHeight: 1.7 }}>
          Let's personalize your space in a few quick steps. You can skip anything and set it up later in Settings.
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
        <StepIndicator step={step} total={STEPS.length} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: 6 }}>Step 1 of 6</div>
          <h2 style={{ marginBottom: 8 }}>Create your first tag</h2>
          <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.6 }}>Tags connect everything across all your sections. What topic are you exploring right now?</p>
        </div>
        <input value={tagName} onChange={e => setTagName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTagSubmit()} placeholder="e.g. philosophy, stoicism, ranching…" autoFocus style={{ fontSize: 14 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skip />
          <button className="btn-primary" onClick={handleTagSubmit} disabled={saving} style={{ fontSize: 13 }}>
            {saving ? 'Saving…' : tagName.trim() ? 'Create Tag →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );

  if (current === 'vocab') return (
    <div className="first-launch">
      <div style={containerStyle}>
        <StepIndicator step={step} total={STEPS.length} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: 6 }}>Step 2 of 6</div>
          <h2 style={{ marginBottom: 8 }}>Add a vocabulary word</h2>
          <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.6 }}>Start your word collection with something you recently came across.</p>
        </div>
        <input value={vocabWord} onChange={e => setVocabWord(e.target.value)} placeholder="e.g. liminal, sonder, perseverate…" autoFocus style={{ fontSize: 14 }} />
        <textarea value={vocabDef} onChange={e => setVocabDef(e.target.value)} placeholder="Definition (optional)" rows={2} style={{ fontSize: 13 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skip />
          <button className="btn-primary" onClick={handleVocabSubmit} disabled={saving} style={{ fontSize: 13 }}>
            {saving ? 'Saving…' : vocabWord.trim() ? 'Add Word →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );

  if (current === 'book') return (
    <div className="first-launch">
      <div style={containerStyle}>
        <StepIndicator step={step} total={STEPS.length} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: 6 }}>Step 3 of 6</div>
          <h2 style={{ marginBottom: 8 }}>Add a book</h2>
          <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.6 }}>What are you reading right now, or what's next on your list?</p>
        </div>
        <input value={bookTitle} onChange={e => setBookTitle(e.target.value)} placeholder="Book title…" autoFocus style={{ fontSize: 14 }} />
        <input value={bookAuthor} onChange={e => setBookAuthor(e.target.value)} placeholder="Author (optional)" style={{ fontSize: 14 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skip />
          <button className="btn-primary" onClick={handleBookSubmit} disabled={saving} style={{ fontSize: 13 }}>
            {saving ? 'Saving…' : bookTitle.trim() ? 'Add Book →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );

  if (current === 'spotify') return (
    <div className="first-launch">
      <div style={containerStyle}>
        <StepIndicator step={step} total={STEPS.length} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: 6 }}>Step 4 of 6</div>
          <h2 style={{ marginBottom: 8 }}>Connect Spotify</h2>
          <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.6 }}>Play a meditation playlist during your breathing and mindfulness sessions.</p>
        </div>
        <a href="/api/spotify/auth" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 'var(--radius)', background: '#1DB954', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}>
          Connect Spotify Account
        </a>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skip />
          <button className="btn-primary" onClick={next} style={{ fontSize: 13 }}>Next →</button>
        </div>
      </div>
    </div>
  );

  if (current === 'period') return (
    <div className="first-launch">
      <div style={containerStyle}>
        <StepIndicator step={step} total={STEPS.length} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: 6 }}>Step 5 of 6</div>
          <h2 style={{ marginBottom: 8 }}>Last period start date</h2>
          <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.6 }}>This helps calculate your current cycle phase right away. You can always add more history in the Cycles tab.</p>
        </div>
        <input type="date" value={periodDate} onChange={e => setPeriodDate(e.target.value)} style={{ fontSize: 14 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skip />
          <button className="btn-primary" onClick={handlePeriodSubmit} disabled={saving} style={{ fontSize: 13 }}>
            {saving ? 'Saving…' : periodDate ? 'Save →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );

  if (current === 'vision') return (
    <div className="first-launch">
      <div style={containerStyle}>
        <StepIndicator step={step} total={STEPS.length} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: 6 }}>Step 6 of 6</div>
          <h2 style={{ marginBottom: 8 }}>Name your first vision</h2>
          <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.6 }}>What's one thing you're working toward? You'll add images and notes in the Vision Board.</p>
        </div>
        <input value={visionTitle} onChange={e => setVisionTitle(e.target.value)} placeholder="e.g. My Ranch, Strong Body, Creative Life…" autoFocus style={{ fontSize: 14 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skip />
          <button className="btn-primary" onClick={handleVisionSubmit} disabled={saving} style={{ fontSize: 13 }}>
            {saving ? 'Saving…' : visionTitle.trim() ? 'Create Vision →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );

  // Done
  return (
    <div className="first-launch">
      <div style={{ ...containerStyle, textAlign: 'center', gap: 20 }}>
        <StepIndicator step={step} total={STEPS.length} />
        <div style={{ fontSize: 48, marginTop: 8 }}>🌵</div>
        <div>
          <h2 style={{ marginBottom: 10 }}>Your brain is ready.</h2>
          <p style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.7 }}>
            Everything you learn, every session, every vision — all in one place. Go build something great.
          </p>
        </div>
        <button className="btn-primary" onClick={onComplete} style={{ alignSelf: 'center', padding: '10px 32px', fontSize: 14 }}>
          Open Sarah's Brain →
        </button>
      </div>
    </div>
  );
}
