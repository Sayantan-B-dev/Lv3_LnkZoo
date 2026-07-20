'use client';
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function Sparkline({ data, color, height = 48 }: { data: { date: string; count: number }[]; color: string; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || data.length < 2) return;
    const el = ref.current;
    const w = el.clientWidth;
    d3.select(el).select('svg').remove();
    const svg = d3.select(el).append('svg').attr('width', w).attr('height', height);
    const parse = d3.timeParse('%Y-%m-%d');
    const pts = data.map(d => ({ date: parse(d.date)!, count: d.count }));
    const x = d3.scaleTime().domain(d3.extent(pts, d => d.date) as [Date, Date]).range([0, w]);
    const y = d3.scaleLinear().domain([0, d3.max(pts, d => d.count) || 1]).range([height, 0]);
    const line = d3.line<{ date: Date; count: number }>().x(d => x(d.date)).y(d => y(d.count)).curve(d3.curveMonotoneX);
    const area = d3.area<{ date: Date; count: number }>().x(d => x(d.date)).y0(height).y1(d => y(d.count)).curve(d3.curveMonotoneX);
    svg.append('path').datum(pts).attr('d', area).attr('fill', color).attr('opacity', 0.12);
    svg.append('path').datum(pts).attr('d', line).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1.5);
  }, [data, color, height]);
  if (data.length < 2) return <div className="adm-sparkline adm-sparkline-empty">No data yet</div>;
  return <div ref={ref} className="adm-sparkline" />;
}
