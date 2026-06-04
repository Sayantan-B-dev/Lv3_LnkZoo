'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const colors = { blue: '#3b82f6', green: '#10b981' };

export default function DualTrendChart({ data, title }: { data: { date: string; posts: number; comments: number }[]; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const height = 280;

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

    const margin = { top: 24, right: 24, bottom: 28, left: 44 };
    const iw = width - margin.left - margin.right;
    const ih = height - margin.top - margin.bottom;

    const svg = d3.select(el).append('svg').attr('width', width).attr('height', height)
      .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const parse = d3.timeParse('%Y-%m-%d');
    const pts = data.map(d => ({ date: parse(d.date)!, posts: d.posts, comments: d.comments }));
    const x = d3.scaleTime().domain(d3.extent(pts, d => d.date) as [Date, Date]).range([0, iw]);
    const y = d3.scaleLinear().domain([0, d3.max(pts, d => Math.max(d.posts, d.comments)) || 1]).nice().range([ih, 0]);

    const defs = svg.append('defs');
    [{ id: 'grad-act-posts', color: colors.blue }, { id: 'grad-act-comments', color: colors.green }].forEach(g => {
      const lg = defs.append('linearGradient').attr('id', g.id).attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
      lg.append('stop').attr('offset', '0%').attr('stop-color', g.color).attr('stop-opacity', 0.3);
      lg.append('stop').attr('offset', '100%').attr('stop-color', g.color).attr('stop-opacity', 0);
    });

    const postsLine = d3.line<{ date: Date; posts: number }>().x(d => x(d.date)).y(d => y(d.posts)).curve(d3.curveMonotoneX);
    const commentsLine = d3.line<{ date: Date; comments: number }>().x(d => x(d.date)).y(d => y(d.comments)).curve(d3.curveMonotoneX);

    svg.append('path').datum(pts).attr('d', d3.area<{ date: Date; posts: number }>().x(d => x(d.date)).y0(ih).y1(d => y(d.posts)).curve(d3.curveMonotoneX) as any).attr('fill', 'url(#grad-act-posts)');
    svg.append('path').datum(pts).attr('d', postsLine as any).attr('fill', 'none').attr('stroke', colors.blue).attr('stroke-width', 2).attr('stroke-linejoin', 'round');
    svg.append('path').datum(pts).attr('d', d3.area<{ date: Date; comments: number }>().x(d => x(d.date)).y0(ih).y1(d => y(d.comments)).curve(d3.curveMonotoneX) as any).attr('fill', 'url(#grad-act-comments)');
    svg.append('path').datum(pts).attr('d', commentsLine as any).attr('fill', 'none').attr('stroke', colors.green).attr('stroke-width', 2).attr('stroke-linejoin', 'round');

    svg.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %d') as any)).attr('color', 'var(--text-4)').selectAll('text').attr('font-size', '10px');
    svg.append('g').call(d3.axisLeft(y).ticks(5)).attr('color', 'var(--text-4)').selectAll('text').attr('font-size', '10px');

    const legend = svg.append('g').attr('transform', `translate(${iw - 110}, 0)`);
    legend.append('line').attr('x1', 0).attr('x2', 14).attr('y1', 4).attr('y2', 4).attr('stroke', colors.blue).attr('stroke-width', 2);
    legend.append('text').attr('x', 18).attr('y', 8).attr('font-size', '10px').attr('fill', 'var(--text-3)').text('Posts');
    legend.append('line').attr('x1', 0).attr('x2', 14).attr('y1', 20).attr('y2', 20).attr('stroke', colors.green).attr('stroke-width', 2);
    legend.append('text').attr('x', 18).attr('y', 24).attr('font-size', '10px').attr('fill', 'var(--text-3)').text('Comments');

    const bisect = d3.bisector<{ date: Date; posts: number; comments: number }, Date>(d => d.date).left;
    const guide = svg.append('line').attr('stroke', 'var(--text-3)').attr('stroke-width', 1).attr('stroke-dasharray', '4,3').attr('y1', 0).attr('y2', ih).attr('opacity', 0);
    const tipBox = svg.append('rect').attr('width', iw).attr('height', ih).attr('fill', 'transparent');

    const dotsP = svg.selectAll('circle.dp').data(pts).enter().append('circle').attr('class', 'adm-dot').attr('cx', d => x(d.date)).attr('cy', d => y(d.posts)).attr('r', 3).attr('fill', colors.blue).attr('stroke', 'var(--bg-1)').attr('stroke-width', 2).attr('opacity', 0);
    const dotsC = svg.selectAll('circle.dc').data(pts).enter().append('circle').attr('class', 'adm-dot').attr('cx', d => x(d.date)).attr('cy', d => y(d.comments)).attr('r', 3).attr('fill', colors.green).attr('stroke', 'var(--bg-1)').attr('stroke-width', 2).attr('opacity', 0);

    tipBox.on('mousemove', (event: MouseEvent) => {
      const mx = d3.pointer(event)[0]; const x0 = x.invert(mx); const i = bisect(pts, x0, 1);
      const d0 = pts[i - 1], d1 = pts[i];
      const p = d1 && x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;
      guide.attr('x1', x(p.date)).attr('x2', x(p.date)).attr('opacity', 1);
      dotsP.attr('opacity', 0); dotsC.attr('opacity', 0);
      d3.select(el).selectAll('circle.dp').filter((d: any) => d === p).attr('opacity', 1).attr('r', 5);
      d3.select(el).selectAll('circle.dc').filter((d: any) => d === p).attr('opacity', 1).attr('r', 5);
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'block';
        tooltipRef.current.style.left = `${Math.min(x(p.date) + margin.left + 12, width - 160)}px`;
        tooltipRef.current.style.top = `${Math.min(y(Math.max(p.posts, p.comments)), ih - 40) + margin.top - 8}px`;
        tooltipRef.current.innerHTML = `<strong>${d3.timeFormat('%b %d')(p.date)}</strong><br/>Posts: ${p.posts} · Comments: ${p.comments}`;
      }
    }).on('mouseleave', () => { guide.attr('opacity', 0); dotsP.attr('opacity', 0); dotsC.attr('opacity', 0); if (tooltipRef.current) tooltipRef.current.style.display = 'none'; });
  }, [data, width, height]);

  return (
    <div className="adm-chart-card adm-chart-full">
      <div className="adm-chart-header">
        <span className="adm-chart-title">{title}</span>
        <span className="adm-chart-total">{data.reduce((s, d) => s + d.posts, 0).toLocaleString()} posts · {data.reduce((s, d) => s + d.comments, 0).toLocaleString()} comments</span>
      </div>
      <div ref={ref} className="adm-chart-body" />
      <div ref={tooltipRef} className="adm-tooltip" />
    </div>
  );
}
