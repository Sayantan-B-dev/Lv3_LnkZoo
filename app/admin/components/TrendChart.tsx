'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ChartEmpty from './ChartEmpty';

export default function TrendChart({ data, title, color, height = 260 }: { data: { date: string; count: number }[]; title: string; color: string; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!ref.current || data.length < 2 || !width) return;
    const el = ref.current;
    d3.select(el).select('svg').remove();
    let cancelled = false;

    const margin = { top: 24, right: 20, bottom: 28, left: 44 };
    const iw = width - margin.left - margin.right;
    const ih = height - margin.top - margin.bottom;

    const svg = d3.select(el).append('svg').attr('width', width).attr('height', height)
      .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const parse = d3.timeParse('%Y-%m-%d');
    const pts = data.map(d => ({ date: parse(d.date)!, count: d.count }));
    const x = d3.scaleTime().domain(d3.extent(pts, d => d.date) as [Date, Date]).range([0, iw]);
    const y = d3.scaleLinear().domain([0, d3.max(pts, d => d.count) || 1]).nice().range([ih, 0]);

    const areaGen = d3.area<{ date: Date; count: number }>().x(d => x(d.date)).y0(ih).y1(d => y(d.count)).curve(d3.curveMonotoneX);
    const lineGen = d3.line<{ date: Date; count: number }>().x(d => x(d.date)).y(d => y(d.count)).curve(d3.curveMonotoneX);

    const gradId = `grad-${title.replace(/\s/g, '')}`;
    const defs = svg.append('defs');
    defs.append('linearGradient').attr('id', gradId).attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%')
      .append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.35);
    defs.select('linearGradient').append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0);

    svg.append('path').datum(pts).attr('d', areaGen).attr('fill', `url(#${gradId})`);
    svg.append('path').datum(pts).attr('d', lineGen).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2).attr('stroke-linejoin', 'round');
    svg.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %d') as any)).attr('color', 'var(--text-4)').selectAll('text').attr('font-size', '10px');
    svg.append('g').call(d3.axisLeft(y).ticks(5)).attr('color', 'var(--text-4)').selectAll('text').attr('font-size', '10px');

    const dots = svg.selectAll('circle.dot').data(pts).enter().append('circle').attr('class', 'adm-dot')
      .attr('cx', d => x(d.date)).attr('cy', d => y(d.count)).attr('r', 3).attr('fill', color).attr('stroke', 'var(--bg-1)').attr('stroke-width', 2).attr('opacity', 0);

    const bisect = d3.bisector<{ date: Date; count: number }, Date>(d => d.date).left;
    const guide = svg.append('line').attr('stroke', 'var(--text-3)').attr('stroke-width', 1).attr('stroke-dasharray', '4,3').attr('y1', 0).attr('y2', ih).attr('opacity', 0);
    const tipBox = svg.append('rect').attr('width', iw).attr('height', ih).attr('fill', 'transparent');

    tipBox.on('mousemove', (event: MouseEvent) => {
      const mx = d3.pointer(event)[0];
      const x0 = x.invert(mx);
      const i = bisect(pts, x0, 1);
      const d0 = pts[i - 1], d1 = pts[i];
      const p = d1 && x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;
      guide.attr('x1', x(p.date)).attr('x2', x(p.date)).attr('opacity', 1);
      dots.attr('opacity', 0);
      d3.select(el).selectAll('circle.dot').filter((d: any) => d === p).attr('opacity', 1).attr('r', 5);
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'block';
        tooltipRef.current.style.left = `${Math.min(x(p.date) + margin.left + 12, width - 140)}px`;
        tooltipRef.current.style.top = `${y(p.count) + margin.top - 8}px`;
        tooltipRef.current.innerHTML = `<strong>${p.count}</strong> on ${d3.timeFormat('%b %d')(p.date)}`;
      }
    }).on('mouseleave', () => {
      guide.attr('opacity', 0); dots.attr('opacity', 0);
      if (tooltipRef.current) tooltipRef.current.style.display = 'none';
    });

    return () => { d3.select(el).select('svg').remove(); };
  }, [data, color, height, width, title]);

  return (
    <div className="adm-chart-card">
      <div className="adm-chart-header">
        <span className="adm-chart-title">{title}</span>
        <span className="adm-chart-total">{data.reduce((s, d) => s + d.count, 0).toLocaleString()} total</span>
      </div>
      {data.length < 2 && <ChartEmpty />}
      <div ref={ref} className="adm-chart-body" style={data.length < 2 ? { display: 'none' } : undefined} />
      <div ref={tooltipRef} className="adm-tooltip" />
    </div>
  );
}
