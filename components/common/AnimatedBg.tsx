'use client';

import React, { useEffect, useRef } from 'react';
import { useUI } from '@/context/UIContext';

export default function AnimatedBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { bgSettings } = useUI();
  const settingsRef = useRef(bgSettings);

  useEffect(() => {
    settingsRef.current = bgSettings;
  }, [bgSettings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W: number, H: number, pts: any[];
    let mx = -1000, my = -1000;

    const initBg = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      const { frequency, size, speed } = settingsRef.current;
      pts = Array.from({ length: frequency }, () => {
        const x = Math.random() * W;
        const y = Math.random() * H;
        return {
          x, y,
          baseX: x, baseY: y, // Anchor positions
          vx: (Math.random() - 0.5) * 0.18 * speed,
          vy: (Math.random() - 0.5) * 0.18 * speed,
          r: (Math.random() * 1.2 + 0.4) * size,
        };
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const drawBg = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, W, H);
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const lineColor = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,';
      const { visibility, size, frequency, speed, repulsion } = settingsRef.current;

      if (pts.length !== frequency) {
        initBg();
      }

      pts.forEach((p) => {
        // Base movement + Homing force to refill space
        // We move the anchor slowly so the whole grid drifts
        p.baseX += p.vx * speed;
        p.baseY += p.vy * speed;

        // Wrap anchors around screen
        if (p.baseX < 0) p.baseX = W;
        if (p.baseX > W) p.baseX = 0;
        if (p.baseY < 0) p.baseY = H;
        if (p.baseY > H) p.baseY = 0;

        // Calculate distance from cursor
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Repulsion force
        if (dist < repulsion) {
          const force = (repulsion - dist) / repulsion;
          const dirX = dx / dist;
          const dirY = dy / dist;
          // Target position when being pushed
          const targetX = p.x - dirX * force * 50 * speed;
          const targetY = p.y - dirY * force * 50 * speed;
          
          p.x += (targetX - p.x) * 0.2;
          p.y += (targetY - p.y) * 0.2;
        } else {
          // Spring back to anchor to "refill" empty space
          p.x += (p.baseX - p.x) * 0.05 * speed;
          p.y += (p.baseY - p.y) * 0.05 * speed;
        }

        // Keep in bounds
        if (p.x < 0) p.x = 0;
        if (p.x > W) p.x = W;
        if (p.y < 0) p.y = 0;
        if (p.y > H) p.y = H;
      });

      // Connections
      ctx.lineWidth = 0.5 * size;
      const maxDist = 180 * (size * 0.5 + 0.5); // Connection distance scales slightly with size
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x,
            dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = lineColor + (1 - d / maxDist) * visibility + ')';
            ctx.stroke();
          }
        }
        // Points
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, pts[i].r, 0, Math.PI * 2);
        ctx.fillStyle = lineColor + (visibility * 1.5) + ')';
        ctx.fill();
      }
      requestAnimationFrame(drawBg);
    };

    window.addEventListener('resize', initBg);
    window.addEventListener('mousemove', onMouseMove);
    initBg();
    const animId = requestAnimationFrame(drawBg);

    return () => {
      window.removeEventListener('resize', initBg);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas id="bg-canvas" ref={canvasRef}></canvas>;
}
