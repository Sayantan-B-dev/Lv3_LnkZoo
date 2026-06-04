'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function HorizBarChart({ data, title }: { data: { name: string; usage_count: number }[]; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

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

    const h = Math.max(200, data.length * 30);
    const margin = { top: 8, right: 50, bottom: 8, left: 110 };
    const iw = width - margin.left - margin.right;
    const ih = h - margin.top - margin.bottom;

    const svg = d3.select(el).append('svg').attr('width', width).attr('height', h)
      .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, d3.max(data, d => d.usage_count) || 1]).range([0, iw]);
    const y = d3.scaleBand().domain(data.map(d => d.name)).range([0, ih]).padding(0.35);

    svg.selectAll('rect').data(data).enter().append('rect')
      .attr('y', d => y(d.name)!).attr('height', y.bandwidth())
      .attr('width', 0).attr('fill', '#f59e0b').attr('rx', 4)
      .transition().duration(600).ease(d3.easeBackOut).attr('width', d => x(d.usage_count));

    svg.selectAll('text.bar-label').data(data).enter().append('text')
      .attr('x', -4).attr('y', d => y(d.name)! + y.bandwidth() / 2).attr('dy', '0.35em')
      .attr('text-anchor', 'end').attr('font-size', '11px').attr('fill', 'var(--text-2)').text(d => d.name);
    svg.selectAll('text.bar-val').data(data).enter().append('text')
      .attr('x', d => x(d.usage_count) + 4).attr('y', d => y(d.name)! + y.bandwidth() / 2).attr('dy', '0.35em')
      .attr('font-size', '11px').attr('fill', 'var(--text-3)').text(d => d.usage_count.toLocaleString());
  }, [data, width]);

  return (
    <div className="adm-chart-card">
      <div className="adm-chart-header"><span className="adm-chart-title">{title}</span></div>
      <div ref={ref} />
    </div>
  );
}
