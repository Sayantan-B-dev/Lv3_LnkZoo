'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/common/ConfirmModal';

interface AdminTopic {
  id: number;
  parent_id: number | null;
  slug: string;
  name: string;
  description: string | null;
  color: string | null;
  sort_order: number;
  link_count: number;
}

const PRESET_COLORS = [
  '#5eead4', '#a78bfa', '#60a5fa', '#f87171', '#fbbf24',
  '#34d399', '#f472b6', '#fb923c', '#22d3ee', '#c084fc',
];

interface EditState {
  name: string;
  description: string;
  color: string;
}

export default function AdminTopics() {
  const { addToast } = useToast();
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [newParent, setNewParent] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [edit, setEdit] = useState<EditState>({ name: '', description: '', color: '' });
  const [confirmDelete, setConfirmDelete] = useState<AdminTopic | null>(null);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/topics');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setTopics(data.topics ?? []);
    } catch {
      addToast('Failed to load topics', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  const types = topics.filter((t) => t.parent_id === null);
  const childrenOf = (id: number) => topics.filter((t) => t.parent_id === id);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          parentId: newParent ? Number(newParent) : null,
          color: newColor,
          description: newDesc.trim() || null,
        }),
      });
      if (res.ok) {
        addToast('Topic created', 'success');
        setNewName(''); setNewDesc(''); setNewParent(''); setNewColor(PRESET_COLORS[0]);
        fetchTopics();
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || 'Failed to create topic', 'error');
      }
    } catch {
      addToast('Failed to create topic', 'error');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (t: AdminTopic) => {
    setEditingId(t.id);
    setEdit({ name: t.name, description: t.description ?? '', color: t.color ?? PRESET_COLORS[0] });
  };

  const handleUpdate = async (id: number) => {
    if (!edit.name.trim()) return;
    try {
      const res = await fetch(`/api/admin/topics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: edit.name.trim(),
          description: edit.description.trim() || null,
          color: edit.color,
        }),
      });
      if (res.ok) {
        addToast('Topic updated', 'success');
        setEditingId(null);
        fetchTopics();
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || 'Failed to update topic', 'error');
      }
    } catch {
      addToast('Failed to update topic', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/admin/topics/${confirmDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Topic deleted', 'success');
        fetchTopics();
      } else {
        addToast('Failed to delete topic', 'error');
      }
    } catch {
      addToast('Failed to delete topic', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  const totalSub = topics.filter((t) => t.parent_id !== null).length;

  const renderEditRow = (t: AdminTopic) => (
    <div className="topic-adm-edit">
      <div className="topic-adm-swatches">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`topic-adm-swatch ${edit.color === c ? 'active' : ''}`}
            style={{ background: c }}
            onClick={() => setEdit((s) => ({ ...s, color: c }))}
          />
        ))}
      </div>
      <input
        className="topic-adm-input"
        value={edit.name}
        onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))}
        placeholder="Name"
      />
      <input
        className="topic-adm-input"
        value={edit.description}
        onChange={(e) => setEdit((s) => ({ ...s, description: e.target.value }))}
        placeholder="Description (optional)"
      />
      <div className="topic-adm-edit-actions">
        <button className="adm-action-btn adm-action-ok" onClick={() => handleUpdate(t.id)}>Save</button>
        <button className="adm-action-btn" onClick={() => setEditingId(null)}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Topics</h1>
          <p className="adm-page-sub">{types.length} types &middot; {totalSub} subtopics</p>
        </div>
      </div>

      <div className="adm-chart-card">
        <div className="adm-chart-header">
          <span className="adm-chart-title">Create Topic</span>
        </div>
        <form onSubmit={handleCreate} className="topic-adm-create">
          <div className="topic-adm-create-row">
            <input
              className="topic-adm-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Topic name"
              required
            />
            <select
              className="adm-role-select topic-adm-select"
              value={newParent}
              onChange={(e) => setNewParent(e.target.value)}
            >
              <option value="">— Topic-type (top level) —</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>Under: {t.name}</option>
              ))}
            </select>
          </div>
          <input
            className="topic-adm-input"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
          />
          <div className="topic-adm-create-row">
            <div className="topic-adm-swatches">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`topic-adm-swatch ${newColor === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setNewColor(c)}
                />
              ))}
            </div>
            <button type="submit" className="adm-action-btn adm-action-ok" disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="adm-empty">Loading topics...</div>
      ) : (
        types.map((type) => (
          <div key={type.id} className="adm-chart-card topic-adm-type">
            {editingId === type.id ? (
              renderEditRow(type)
            ) : (
              <div className="topic-adm-type-header">
                <span className="topic-adm-dot" style={{ background: type.color || 'var(--accent)' }} />
                <span className="topic-adm-type-name">{type.name}</span>
                <span className="topic-adm-slug">/{type.slug}</span>
                <span className="topic-adm-count">{childrenOf(type.id).length} subtopics</span>
                <div className="topic-adm-actions">
                  <button className="adm-action-btn" onClick={() => startEdit(type)}>Edit</button>
                  <button className="adm-action-btn adm-action-danger" onClick={() => setConfirmDelete(type)}>Delete</button>
                </div>
              </div>
            )}

            <div className="topic-adm-children">
              {childrenOf(type.id).map((child) => (
                <div key={child.id} className="topic-adm-child">
                  {editingId === child.id ? (
                    renderEditRow(child)
                  ) : (
                    <>
                      <span className="topic-adm-dot sm" style={{ background: child.color || 'var(--accent)' }} />
                      <span className="topic-adm-child-name">{child.name}</span>
                      <span className="topic-adm-slug">/{child.slug}</span>
                      <span className="topic-adm-count">{child.link_count} links</span>
                      <div className="topic-adm-actions">
                        <button className="adm-action-btn" onClick={() => startEdit(child)}>Edit</button>
                        <button className="adm-action-btn adm-action-danger" onClick={() => setConfirmDelete(child)}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {childrenOf(type.id).length === 0 && (
                <div className="topic-adm-empty">No subtopics yet</div>
              )}
            </div>
          </div>
        ))
      )}

      {confirmDelete && (
        <ConfirmModal
          message={
            confirmDelete.parent_id === null
              ? `Delete "${confirmDelete.name}" and all its subtopics? Links in these topics will be untagged.`
              : `Delete "${confirmDelete.name}"? Links in this topic will be untagged.`
          }
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
