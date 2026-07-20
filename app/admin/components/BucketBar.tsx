'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ChartEmpty from './ChartEmpty';

type Datum = { label: string; count: number };

export default function BucketBar({
  data, title, color = '#a78bfa', suffix = '',
}: { data: Datum[]; title: string; color?: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const height = 220;

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!ref.current || !data.length || !width) return;
    const el = ref.current;
    d3.select(el).select('svg').remove();

    const margin = { top: 20, right: 12, bottom: 30, left: 36 };
    const iw = width - margin.left - margin.right;
    const ih = height - margin.top - margin.bottom;

    const svg = d3.select(el).append('svg').attr('width', width).attr('height', height)
      .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(data.map(d => d.label)).range([0, iw]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count) || 1]).nice().range([ih, 0]);

    svg.selectAll('rect').data(data).enter().append('rect')
      .attr('x', d => x(d.label)!).attr('width', x.bandwidth())
      .attr('y', ih).attr('height', 0).attr('fill', color).attr('rx', 4)
      .transition().duration(600).ease(d3.easeCubicOut)
      .attr('y', d => y(d.count)).attr('height', d => ih - y(d.count));

    svg.selectAll('text.val').data(data).enter().append('text')
      .attr('x', d => x(d.label)! + x.bandwidth() / 2).attr('y', d => y(d.count) - 6)
      .attr('text-anchor', 'middle').attr('font-size', '11px').attr('font-weight', '600').attr('fill', 'var(--text-2)')
      .text(d => d.count.toLocaleString());

    svg.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x))
      .attr('color', 'var(--text-4)').selectAll('text').attr('font-size', '10px')
      .text((d: any) => `${d}${suffix}`);
    svg.append('g').call(d3.axisLeft(y).ticks(4)).attr('color', 'var(--text-4)').selectAll('text').attr('font-size', '10px');
  }, [data, width, color, suffix]);

  return (
    <div className="adm-chart-card">
      <div className="adm-chart-header"><span className="adm-chart-title">{title}</span></div>
      {!data.length && <ChartEmpty />}
      <div ref={ref} style={!data.length ? { display: 'none' } : undefined} />
    </div>
  );
}
