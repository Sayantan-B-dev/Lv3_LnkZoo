'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const palette = ['#3b82f6', '#f59e0b', '#ef4444'];

export default function DonutChart({ data, title }: { data: { role: string; count: number }[]; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
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
    if (legendRef.current) d3.select(legendRef.current).selectAll('*').remove();

    const size = Math.min(width, 220);
    const radius = size / 2;
    const cmap = d3.scaleOrdinal<string>().domain(data.map(d => d.role)).range(palette);

    const svg = d3.select(el).append('svg').attr('width', size).attr('height', size)
      .append('g').attr('transform', `translate(${radius},${radius})`);

    const pie = d3.pie<{ role: string; count: number }>().value(d => d.count).sort(null);
    const arc = d3.arc<d3.PieArcDatum<{ role: string; count: number }>>().innerRadius(radius * 0.55).outerRadius(radius - 6);
    const arcHover = d3.arc<d3.PieArcDatum<{ role: string; count: number }>>().innerRadius(radius * 0.55).outerRadius(radius - 2);

    svg.selectAll('path').data(pie(data)).enter().append('path')
      .attr('d', arc).attr('fill', d => cmap(d.data.role)).attr('stroke', 'var(--bg-1)').attr('stroke-width', 2)
      .on('mouseenter', function () { d3.select(this).transition().duration(200).attr('d', arcHover as any); })
      .on('mouseleave', function () { d3.select(this).transition().duration(200).attr('d', arc as any); });

    const total = data.reduce((s, d) => s + d.count, 0);
    svg.append('text').attr('text-anchor', 'middle').attr('dy', '-0.1em').attr('font-size', '20px').attr('font-weight', '700').attr('fill', 'var(--text)').text(total);
    svg.append('text').attr('text-anchor', 'middle').attr('dy', '1.2em').attr('font-size', '10px').attr('fill', 'var(--text-3)').text('users');

    const legend = d3.select(legendRef.current!);
    data.forEach(d => {
      const row = legend.append('div').attr('class', 'adm-legend-item');
      row.append('span').attr('class', 'adm-legend-dot').style('background', cmap(d.role));
      row.append('span').attr('class', 'adm-legend-label').text(d.role.charAt(0).toUpperCase() + d.role.slice(1));
      row.append('span').attr('class', 'adm-legend-count').text(d.count.toLocaleString());
    });

    return () => {
      d3.select(el).select('svg').remove();
      if (legendRef.current) d3.select(legendRef.current).selectAll('*').remove();
    };
  }, [data, width]);

  return (
    <div className="adm-chart-card">
      <div className="adm-chart-header"><span className="adm-chart-title">{title}</span></div>
      <div className="adm-donut-wrap">
        <div ref={ref} />
        <div ref={legendRef} className="adm-legend" />
      </div>
    </div>
  );
}
