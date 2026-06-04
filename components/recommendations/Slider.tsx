'use client';

import React, { useRef } from 'react';

interface SliderProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  title?: string;
}

export default function Slider({ items, renderItem, title }: SliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <div className="slider">
      {title && (
        <div className="slider-header">
          <h3 className="slider-title">{title}</h3>
          <div className="slider-arrows">
            <button className="slider-arrow" onClick={() => scroll('left')} aria-label="Previous">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button className="slider-arrow" onClick={() => scroll('right')} aria-label="Next">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <div className="slider-track" ref={scrollRef}>
        {items.map((item, i) => (
          <div key={i} className="slider-item">
            {renderItem(item, i)}
          </div>
        ))}
      </div>
    </div>
  );
}
