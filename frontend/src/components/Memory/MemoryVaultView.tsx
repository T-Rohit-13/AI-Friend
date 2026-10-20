import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { UserMemory } from '../../services/api';

export const MemoryVaultView: React.FC = () => {
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [newFact, setNewFact] = useState('');
  const [category, setCategory] = useState('preference');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    const list = await api.getMemories();
    setMemories(list);
  };

  const handleAddMemory = async () => {
    if (!newFact.trim()) return;
    setIsSaving(true);
    await api.addMemory(newFact.trim(), category);
    setNewFact('');
    setMessage('Memory saved to your private vault.');
    setTimeout(() => setMessage(null), 3000);
    await loadMemories();
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    await api.deleteMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you certain? This will permanently erase all facts remembered about you.')) {
      await api.clearAllMemories();
      setMemories([]);
      setMessage('All memories have been permanently purged (GDPR Right-to-Forget satisfied).');
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        maxWidth: '720px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Header & GDPR Privacy Guarantee */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🧠</span>
            <span>Transparent Memory Vault</span>
          </h2>
          <button
            onClick={handleClearAll}
            className="btn-ghost"
            style={{
              color: '#ef4444',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              fontSize: '0.8rem',
            }}
          >
            🗑️ Erase All Memories (Right to Forget)
          </button>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
          Total transparency guarantee: AI Friend only retains personal facts you explicitly share. You can inspect or purge any fact at any time.
        </p>
      </div>

      {message && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            background: 'rgba(45, 212, 191, 0.15)',
            border: '1px solid var(--color-primary-400)',
            color: 'var(--color-primary-400)',
            fontSize: '0.85rem',
          }}
        >
          {message}
        </div>
      )}

      {/* Add Memory Input */}
      <div
        className="glass-panel-elevated"
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tell AI Friend something to remember:</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={newFact}
            onChange={(e) => setNewFact(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
            placeholder="e.g. My favorite tea is peppermint, preparing for a marathon..."
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          >
            <option value="preference">Preference ⭐</option>
            <option value="goal">Goal 🎯</option>
            <option value="bio">Personal Bio 👤</option>
            <option value="interest">Interest 🎨</option>
          </select>
          <button onClick={handleAddMemory} disabled={isSaving || !newFact.trim()} className="btn-primary">
            Save Fact
          </button>
        </div>
      </div>

      {/* Memory List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Stored Personal Facts ({memories.length}):
        </div>

        {memories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Zero memories stored. Your vault is completely clean.
          </div>
        ) : (
          memories.map((mem) => (
            <div
              key={mem.id}
              className="glass-panel-elevated"
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '0.925rem' }}>{mem.fact}</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="pill-tag" style={{ fontSize: '0.7rem' }}>
                    {mem.category}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Saved {new Date(mem.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(mem.id)}
                className="btn-ghost"
                style={{ padding: '6px 10px', color: '#f87171', fontSize: '0.8rem' }}
                title="Delete this fact"
              >
                ✕ Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
