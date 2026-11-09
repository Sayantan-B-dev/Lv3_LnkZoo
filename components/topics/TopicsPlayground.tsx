'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface TopicOption {
  id: number;
  slug: string;
  name: string;
  color: string | null;
  link_count: number;
}

export interface TopicTypeGroup {
  id: number;
  slug: string;
  name: string;
  color: string | null;
  link_count: number;
  topics: TopicOption[];
}

interface CardBody {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  dragging: boolean;
  hovered: boolean;
  kickTimer: number;
}

interface DragState {
  id: number;
  offsetX: number;
  offsetY: number;
  lastT: number;
  vx: number;
  vy: number;
}

interface Params {
  motion: boolean;
  speed: number;
  bounce: number;
  chaos: number;
  friction: number;
  gravity: number;
  rate: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const DEFAULT_PARAMS: Params = {
  motion: true,
  speed: 1,
  bounce: 0.85,
  chaos: 0.6,
  friction: 0.995,
  gravity: 0,
  rate: 1,
};

export default function TopicsPlayground({ types }: { types: TopicTypeGroup[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const cardsRef = useRef<CardBody[]>([]);
  const dragRef = useRef<DragState | null>(null);

  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const setCardRef = (id: number) => (el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  };

  const applyTransform = useCallback((card: CardBody) => {
    const el = cardRefs.current.get(card.id);
    if (el) el.style.transform = `translate3d(${card.x}px, ${card.y}px, 0)`;
  }, []);

  const layout = useCallback(() => {
    const container = containerRef.current;
    if (!container || types.length === 0) return;

    const width = container.clientWidth;
    if (width <= 0) return;

    const gap = 12;
    let cols = Math.floor((width + gap) / (180 + gap));
    cols = clamp(cols, 1, 9);
    const cardW = (width - gap * (cols - 1)) / cols;

    types.forEach((type) => {
      const el = cardRefs.current.get(type.id);
      if (el) el.style.width = `${cardW}px`;
    });

    const heights = types.map((type) => cardRefs.current.get(type.id)?.offsetHeight ?? 120);
    const colHeights = new Array(cols).fill(0);
    const previous = new Map(cardsRef.current.map((card) => [card.id, card]));

    const cards: CardBody[] = types.map((type, index) => {
      const h = heights[index];
      let col = 0;
      for (let c = 1; c < cols; c++) {
        if (colHeights[c] < colHeights[col]) col = c;
      }
      const x = col * (cardW + gap);
      const y = colHeights[col];
      colHeights[col] += h + gap;
      const prev = previous.get(type.id);
      return {
        id: type.id,
        x,
        y,
        w: cardW,
        h,
        vx: prev?.vx ?? (Math.random() - 0.5) * 1.2,
        vy: prev?.vy ?? (Math.random() - 0.5) * 1.2,
        dragging: false,
        hovered: false,
        kickTimer: 60 + Math.random() * 240,
      };
    });

    cardsRef.current = cards;
    const totalHeight = Math.max(200, ...colHeights.map((h) => h - gap));
    container.style.height = `${totalHeight}px`;
    cards.forEach(applyTransform);
  }, [types, applyTransform]);

  const resetLayout = useCallback(() => {
    dragRef.current = null;
    cardRefs.current.forEach((el) => el.classList.remove('dragging'));
    cardsRef.current.forEach((card) => {
      card.dragging = false;
      card.hovered = false;
    });
    paramsRef.current = DEFAULT_PARAMS;
    setParams(DEFAULT_PARAMS);
    layout();
    cardsRef.current.forEach((card) => {
      card.vx = 0;
      card.vy = 0;
      card.kickTimer = 180 + Math.random() * 240;
      applyTransform(card);
    });
  }, [layout, applyTransform]);

  useLayoutEffect(() => {
    layout();
  }, [layout]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let lastWidth = container.clientWidth;
    const observer = new ResizeObserver(() => {
      if (Math.abs(container.clientWidth - lastWidth) > 2) {
        lastWidth = container.clientWidth;
        layout();
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [layout]);

  useEffect(() => {
    if (types.length === 0) return;
    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = clamp((now - last) / 16.667, 0.2, 2);
      last = now;
      const container = containerRef.current;
      if (container) {
        const W = container.clientWidth;
        const H = container.clientHeight;
        const p = paramsRef.current;
        const cards = cardsRef.current;

        if (p.motion) {
          const damping = Math.pow(p.friction, dt);
          for (const card of cards) {
            if (card.dragging) continue;
            if (card.hovered) {
              card.vx *= 0.9;
              card.vy *= 0.9;
            } else {
              card.vx *= damping;
              card.vy *= damping;
            }

            card.vy += p.gravity * dt;
            card.x += card.vx * dt * p.speed;
            card.y += card.vy * dt * p.speed;

            card.kickTimer -= dt * p.rate;
            if (card.kickTimer <= 0) {
              card.kickTimer = 100 + Math.random() * 240;
              const angle = Math.random() * Math.PI * 2;
              const force = 0.08 + p.chaos * 0.45;
              card.vx += Math.cos(angle) * force;
              card.vy += Math.sin(angle) * force;
            }

            const maxSpeed = 1.2 + p.speed * 2.2;
            const speed = Math.hypot(card.vx, card.vy);
            if (speed > maxSpeed) {
              card.vx = (card.vx / speed) * maxSpeed;
              card.vy = (card.vy / speed) * maxSpeed;
            }

            bounceBounds(card, W, H, p.bounce);
          }
        }

        resolveCollisions(cards, W, H, p.bounce);
        cards.forEach(applyTransform);
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [types.length, applyTransform]);

  const startDrag = (id: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const card = cardsRef.current.find((c) => c.id === id);
    if (!container || !card) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = container.getBoundingClientRect();
    dragRef.current = {
      id,
      offsetX: e.clientX - rect.left - card.x,
      offsetY: e.clientY - rect.top - card.y,
      lastT: performance.now(),
      vx: 0,
      vy: 0,
    };

    card.dragging = true;
    card.vx = 0;
    card.vy = 0;
    cardRefs.current.get(id)?.classList.add('dragging');
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const container = containerRef.current;
    if (!drag || !container) return;
    const card = cardsRef.current.find((c) => c.id === drag.id);
    if (!card) return;

    e.preventDefault();

    const rect = container.getBoundingClientRect();
    const nx = clamp(e.clientX - rect.left - drag.offsetX, 0, container.clientWidth - card.w);
    const ny = clamp(e.clientY - rect.top - drag.offsetY, 0, container.clientHeight - card.h);

    const now = performance.now();
    const dt = Math.max(8, now - drag.lastT);
    drag.vx = ((nx - card.x) / dt) * 16.667;
    drag.vy = ((ny - card.y) / dt) * 16.667;
    drag.lastT = now;

    card.x = nx;
    card.y = ny;
    applyTransform(card);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const card = cardsRef.current.find((c) => c.id === drag.id);
    if (card) {
      card.dragging = false;
      card.vx = clamp(drag.vx, -4, 4);
      card.vy = clamp(drag.vy, -4, 4);
      cardRefs.current.get(card.id)?.classList.remove('dragging');
    }
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const setHovered = (id: number, hovered: boolean) => {
    const card = cardsRef.current.find((c) => c.id === id);
    if (card) card.hovered = hovered;
  };

  return (
    <>
      <div ref={containerRef} className="topic-table">
        {types.map((type) => (
          <section
            key={type.id}
            ref={setCardRef(type.id)}
            className="topic-col topic-float"
            style={type.color ? ({ '--topic-color': type.color } as React.CSSProperties) : undefined}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHovered(type.id, true); }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHovered(type.id, false); }}
          >
            <div
              className="topic-type-header topic-drag-handle"
              onPointerDown={startDrag(type.id)}
              onPointerMove={onDragMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              title="Drag to move"
            >
              <span className="topic-type-name">{type.name}</span>
              <span className="topic-type-count">{type.link_count}</span>
            </div>
            <div className="topic-col-list">
              {type.topics.map((t) => (
                <Link
                  key={t.id}
                  href={`/topics/${t.slug}`}
                  className="card-topic-badge topic-chip"
                  style={t.color ? ({ '--topic-color': t.color } as React.CSSProperties) : undefined}
                  draggable={false}
                >
                  <span className="topic-chip-name">{t.name}</span>
                  <span className="topic-chip-count">{t.link_count}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="topic-controls">
        <button
          type="button"
          className="topic-ctrl-btn"
          onClick={() => setParams((p) => ({ ...p, motion: !p.motion }))}
        >
          {params.motion ? 'Pause motion' : 'Resume motion'}
        </button>
        <button type="button" className="topic-ctrl-btn" onClick={resetLayout}>
          Reset layout
        </button>
        <label className="topic-ctrl">
          <span>Speed</span>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.1"
            value={params.speed}
            onChange={(e) => setParams((p) => ({ ...p, speed: Number(e.target.value) }))}
          />
        </label>
        <label className="topic-ctrl">
          <span>Bounce</span>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.05"
            value={params.bounce}
            onChange={(e) => setParams((p) => ({ ...p, bounce: Number(e.target.value) }))}
          />
        </label>
        <label className="topic-ctrl">
          <span>Chaos</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={params.chaos}
            onChange={(e) => setParams((p) => ({ ...p, chaos: Number(e.target.value) }))}
          />
        </label>
        <label className="topic-ctrl">
          <span>Friction</span>
          <input
            type="range"
            min="0.95"
            max="1"
            step="0.001"
            value={params.friction}
            onChange={(e) => setParams((p) => ({ ...p, friction: Number(e.target.value) }))}
          />
        </label>
        <label className="topic-ctrl">
          <span>Gravity</span>
          <input
            type="range"
            min="0"
            max="0.08"
            step="0.005"
            value={params.gravity}
            onChange={(e) => setParams((p) => ({ ...p, gravity: Number(e.target.value) }))}
          />
        </label>
        <label className="topic-ctrl">
          <span>Rate</span>
          <input
            type="range"
            min="0.2"
            max="3"
            step="0.1"
            value={params.rate}
            onChange={(e) => setParams((p) => ({ ...p, rate: Number(e.target.value) }))}
          />
        </label>
      </div>
    </>
  );
}

function bounceBounds(card: CardBody, W: number, H: number, bounce: number) {
  if (card.x < 0) {
    card.x = 0;
    card.vx = Math.abs(card.vx) * bounce;
  } else if (card.x + card.w > W) {
    card.x = W - card.w;
    card.vx = -Math.abs(card.vx) * bounce;
  }

  if (card.y < 0) {
    card.y = 0;
    card.vy = Math.abs(card.vy) * bounce;
  } else if (card.y + card.h > H) {
    card.y = H - card.h;
    card.vy = -Math.abs(card.vy) * bounce;
  }
}

function resolveCollisions(cards: CardBody[], W: number, H: number, bounce: number) {
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const a = cards[i];
        const b = cards[j];

        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (overlapX <= 0 || overlapY <= 0) continue;

        if (overlapX < overlapY) {
          const dir = a.x + a.w / 2 < b.x + b.w / 2 ? -1 : 1;
          const push = overlapX + 0.5;
          if (a.dragging && !b.dragging) {
            b.x -= dir * push;
            b.vx = a.vx * bounce;
          } else if (b.dragging && !a.dragging) {
            a.x += dir * push;
            a.vx = b.vx * bounce;
          } else if (!a.dragging && !b.dragging) {
            a.x += (dir * push) / 2;
            b.x -= (dir * push) / 2;
            const avx = a.vx;
            a.vx = b.vx * bounce;
            b.vx = avx * bounce;
          }
        } else {
          const dir = a.y + a.h / 2 < b.y + b.h / 2 ? -1 : 1;
          const push = overlapY + 0.5;
          if (a.dragging && !b.dragging) {
            b.y -= dir * push;
            b.vy = a.vy * bounce;
          } else if (b.dragging && !a.dragging) {
            a.y += dir * push;
            a.vy = b.vy * bounce;
          } else if (!a.dragging && !b.dragging) {
            a.y += (dir * push) / 2;
            b.y -= (dir * push) / 2;
            const avy = a.vy;
            a.vy = b.vy * bounce;
            b.vy = avy * bounce;
          }
        }
      }
    }
  }

  cards.forEach((card) => {
    if (card.dragging) return;
    card.x = clamp(card.x, 0, Math.max(0, W - card.w));
    card.y = clamp(card.y, 0, Math.max(0, H - card.h));
  });
}
