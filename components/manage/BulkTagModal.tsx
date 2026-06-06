'use client';

import { useState } from 'react';

interface BulkTagModalProps {
  onConfirm: (addTags: string[], removeTags: string[]) => void;
  onCancel: () => void;
}

export default function BulkTagModal({ onConfirm, onCancel }: BulkTagModalProps) {
  const [addInput, setAddInput] = useState('');
  const [removeInput, setRemoveInput] = useState('');

  const handleConfirm = () => {
    const addTags = addInput.split(',').map(t => t.trim()).filter(Boolean);
    const removeTags = removeInput.split(',').map(t => t.trim()).filter(Boolean);
    onConfirm(addTags, removeTags);
  };

  return (
    <div className="ml-modal-overlay" onClick={onCancel}>
      <div className="ml-modal-box" onClick={e => e.stopPropagation()}>
        <div className="ml-modal-title">Manage Tags</div>

        <label className="ml-modal-label">Add tags (comma separated)</label>
        <input
          className="ml-modal-input"
          placeholder="tag1, tag2, tag3"
          value={addInput}
          onChange={e => setAddInput(e.target.value)}
          autoFocus
        />

        <label className="ml-modal-label">Remove tags (comma separated)</label>
        <input
          className="ml-modal-input"
          placeholder="tag1, tag2"
          value={removeInput}
          onChange={e => setRemoveInput(e.target.value)}
        />

        <div className="ml-modal-actions">
          <button className="ml-bulk-btn" onClick={onCancel}>Cancel</button>
          <button className="ml-bulk-btn" style={{ background: 'var(--text)', color: 'var(--bg)', borderColor: 'var(--text)' }} onClick={handleConfirm}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
