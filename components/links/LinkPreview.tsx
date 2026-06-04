'use client';

import React from 'react';

interface LinkPreviewProps {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  compact?: boolean;
}

export default function LinkPreview({ url, title, description, image, compact = false }: LinkPreviewProps) {
  let domain = '';
  try { domain = new URL(url).hostname; } catch { domain = url; }

  if (compact) {
    return (
      <div className="link-preview compact">
        {image && (
          <div className="preview-thumb">
            <img src={image} alt={title || ''} />
          </div>
        )}
        <div className="preview-info">
          <span className="preview-domain">{domain}</span>
          {title && <span className="preview-title">{title}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="link-preview">
      {image && (
        <div className="preview-image">
          <img src={image} alt={title || ''} />
        </div>
      )}
      <div className="preview-body">
        <span className="preview-domain">{domain}</span>
        {title && <h4 className="preview-title">{title}</h4>}
        {description && <p className="preview-desc">{description}</p>}
      </div>
    </div>
  );
}
