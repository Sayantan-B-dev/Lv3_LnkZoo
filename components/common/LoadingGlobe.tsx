'use client';

import React, { useEffect, useRef } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export default function LoadingGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 45;

    const NODES = 300;
    const CONNECT_DIST = 0;
    const ROTATION_SPEED = 0.05;

    let nodes: Point3D[] = [];

    const initGlobe = () => {
      const w = canvas.width = window.innerWidth;
      const h = canvas.height = window.innerHeight;

      const radius = Math.min(w, h) * 0.09;

      nodes = [];
      for (let i = 0; i < NODES; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        nodes.push({
          x: radius * Math.sin(phi) * Math.cos(theta),
          y: radius * Math.sin(phi) * Math.sin(theta),
          z: radius * Math.cos(phi),
        });
      }
    };

    const project = (p: Point3D, cx: number, cy: number) => {
      const scale = 500 / (600 + p.z);
      return {
        x: cx + p.x * scale,
        y: cy + p.y * scale,
        r: Math.max(1, 2 * scale),
      };
    };

    const draw = () => {
      const w = canvas!.width;
      const h = canvas!.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      angle += ROTATION_SPEED;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const style = getComputedStyle(document.documentElement);
      const textColor = style.getPropertyValue('--text').trim();
      const text2Color = style.getPropertyValue('--text-2').trim();
      const text3Color = style.getPropertyValue('--text-3').trim();

      const rotated = nodes.map((p) => ({
        x: p.x * cosA - p.z * sinA,
        y: p.y,
        z: p.x * sinA + p.z * cosA,
      }));

      const projected = rotated.map((p) => {
        const pr = project(p, cx, cy);
        return { ...p, px: pr.x, py: pr.y, pr: pr.r };
      });

      projected.sort((a, b) => a.z - b.z);

      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dz = projected[i].z - projected[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < CONNECT_DIST * 100) {
            const opacity = Math.max(0, 1 - dist / (CONNECT_DIST * 100)) * 0.25;
            ctx.beginPath();
            ctx.moveTo(projected[i].px, projected[i].py);
            ctx.lineTo(projected[j].px, projected[j].py);
            ctx.strokeStyle = `${text3Color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 0.15;
            ctx.stroke();
          }
        }
      }

      for (const p of projected) {
        const zFactor = 1 - (p.z + 200) / 400;
        const alpha = Math.max(0.4, Math.min(1, zFactor));
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.pr, 0, Math.PI * 1);
        const hex = Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillStyle = `${textColor}${hex}`;
        ctx.shadowColor = `${text2Color}${hex}`;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(draw);
    };

    initGlobe();
    draw();

    const onResize = () => {
      initGlobe();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="loading-globe-wrap">
      <canvas ref={canvasRef} className="loading-globe-canvas" />
      <div className="loading-globe-text">Loading</div>
    </div>
  );
}
