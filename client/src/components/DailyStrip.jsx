import React from 'react';

function timeAgo(ts) {
  if (!ts) return 'never opened';
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return `${months} months ago`;
}

function DailyCard({ accentColor, label, children, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        background: 'var(--card)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        borderTop: `3px solid ${accentColor}`,
        padding: '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 150ms ease, transform 150ms ease',
        minWidth: 0
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: accentColor,
        marginBottom: 8
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export default function DailyStrip({ data, onSelectEntry }) {
  const { vocab, wisdom, deepDive } = data;

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      padding: '12px 16px',
      background: 'var(--panel)',
      borderBottom: '1.5px solid var(--border)',
      flexShrink: 0
    }}>
      {/* Word of the Day */}
      <DailyCard
        accentColor="var(--clay)"
        label="Word of the Day"
        onClick={vocab ? () => onSelectEntry(vocab) : undefined}
      >
        {vocab ? (
          <>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 4 }}>
              {vocab.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-mid)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {vocab.definition || 'No definition yet.'}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-light)', fontStyle: 'italic' }}>Add vocabulary entries to see your word of the day.</div>
        )}
      </DailyCard>

      {/* Wisdom Today */}
      <DailyCard
        accentColor="var(--sage-mid)"
        label="Wisdom Today"
        onClick={wisdom ? () => onSelectEntry(wisdom) : undefined}
      >
        {wisdom ? (
          <>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontStyle: 'italic', color: 'var(--text-dark)', marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              "{wisdom.body}"
            </div>
            {wisdom.author && (
              <div style={{ fontSize: 12, color: 'var(--text-light)' }}>— {wisdom.author}</div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-light)', fontStyle: 'italic' }}>Add wisdom entries to see today's insight.</div>
        )}
      </DailyCard>

      {/* Deep Dive Revisit */}
      <DailyCard
        accentColor="var(--clay-light)"
        label="Deep Dive Revisit"
        onClick={deepDive ? () => onSelectEntry(deepDive) : undefined}
      >
        {deepDive ? (
          <>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {deepDive.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
              Last visited {timeAgo(deepDive.last_opened)}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-light)', fontStyle: 'italic' }}>Add deep dive entries to revisit old topics.</div>
        )}
      </DailyCard>
    </div>
  );
}
