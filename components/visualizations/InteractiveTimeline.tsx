'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Stethoscope,
  FlaskConical,
  Pill,
  Scissors,
  ScanLine,
  Activity,
  Syringe,
  FileText
} from 'lucide-react';
import type { TimelineEvent } from '@/lib/store';

interface InteractiveTimelineProps {
  events: TimelineEvent[];
  onEventSelect?: (event: TimelineEvent) => void;
  selectedEventId?: string | null;
}

const EVENT_COLORS: Record<string, string> = {
  encounter: '#3b82f6',
  diagnosis: '#ef4444',
  lab_result: '#10b981',
  medication: '#8b5cf6',
  procedure: '#f59e0b',
  imaging: '#06b6d4',
  vital_signs: '#ec4899',
  immunization: '#84cc16',
  note: '#6b7280',
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  encounter: <Stethoscope className="w-4 h-4" />,
  diagnosis: <AlertCircle className="w-4 h-4" />,
  lab_result: <FlaskConical className="w-4 h-4" />,
  medication: <Pill className="w-4 h-4" />,
  procedure: <Scissors className="w-4 h-4" />,
  imaging: <ScanLine className="w-4 h-4" />,
  vital_signs: <Activity className="w-4 h-4" />,
  immunization: <Syringe className="w-4 h-4" />,
  note: <FileText className="w-4 h-4" />,
};

const SIGNIFICANCE_RADIUS: Record<string, number> = {
  critical: 14,
  high: 11,
  medium: 8,
  low: 6,
};

export function InteractiveTimeline({ events, onEventSelect, selectedEventId }: InteractiveTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Sort events by date
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [events]);

  // Calculate date range
  const dateExtent = useMemo(() => {
    if (sortedEvents.length === 0) return [new Date(), new Date()];
    const dates = sortedEvents.map(e => new Date(e.date));
    return d3.extent(dates) as [Date, Date];
  }, [sortedEvents]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({ width: Math.max(width, 400), height: 400 });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // D3 Timeline rendering
  useEffect(() => {
    if (!svgRef.current || sortedEvents.length === 0) return;

    const svg = d3.select(svgRef.current);
    const margin = { top: 40, right: 40, bottom: 60, left: 40 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create scales
    const xScale = d3.scaleTime()
      .domain(dateExtent)
      .range([0, width]);

    const transformedXScale = transform.rescaleX(xScale);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add gradient background
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'timeline-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#eff6ff');
    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#f0fdf4');
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#fef3c7');

    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#timeline-gradient)')
      .attr('rx', 8);

    // Create clip path
    defs.append('clipPath')
      .attr('id', 'timeline-clip')
      .append('rect')
      .attr('width', width)
      .attr('height', height);

    // Add grid lines
    const gridGroup = g.append('g')
      .attr('class', 'grid')
      .attr('clip-path', 'url(#timeline-clip)');

    const tickCount = Math.max(Math.floor(width / 100), 4);
    const xAxis = d3.axisBottom(transformedXScale)
      .ticks(tickCount)
      .tickSize(-height)
      .tickFormat(() => '');

    gridGroup.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '2,2');

    // Add timeline axis
    const axisGroup = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(transformedXScale)
        .ticks(tickCount)
        .tickFormat(d => format(d as Date, 'MMM yyyy')))
      .attr('font-size', '11px')
      .attr('color', '#64748b');

    axisGroup.select('.domain').attr('stroke', '#cbd5e1');
    axisGroup.selectAll('.tick line').attr('stroke', '#cbd5e1');

    // Add main timeline line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', height / 2)
      .attr('y2', height / 2)
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4');

    // Create events group with clip
    const eventsGroup = g.append('g')
      .attr('class', 'events')
      .attr('clip-path', 'url(#timeline-clip)');

    // Group events by year for vertical positioning
    const eventsByYear: Record<number, TimelineEvent[]> = {};
    sortedEvents.forEach(event => {
      const year = new Date(event.date).getFullYear();
      if (!eventsByYear[year]) eventsByYear[year] = [];
      eventsByYear[year].push(event);
    });

    // Calculate vertical position with collision avoidance
    const getYPosition = (event: TimelineEvent, index: number) => {
      const baseY = height / 2;
      const offset = (index % 2 === 0 ? -1 : 1) * (40 + (Math.floor(index / 2) * 30));
      return baseY + offset;
    };

    // Draw connecting lines
    sortedEvents.forEach((event, index) => {
      const x = transformedXScale(new Date(event.date));
      const y = getYPosition(event, index);

      if (x >= 0 && x <= width) {
        eventsGroup.append('line')
          .attr('x1', x)
          .attr('x2', x)
          .attr('y1', height / 2)
          .attr('y2', y)
          .attr('stroke', EVENT_COLORS[event.event_type] || '#6b7280')
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.5);
      }
    });

    // Draw event nodes
    const nodes = eventsGroup.selectAll('.event-node')
      .data(sortedEvents)
      .enter()
      .append('g')
      .attr('class', 'event-node')
      .attr('transform', (d, i) => {
        const x = transformedXScale(new Date(d.date));
        const y = getYPosition(d, i);
        return `translate(${x},${y})`;
      })
      .style('cursor', 'pointer')
      .style('opacity', (d, i) => {
        const x = transformedXScale(new Date(d.date));
        return x >= 0 && x <= width ? 1 : 0;
      });

    // Add glow effect for critical events
    nodes.filter(d => d.clinical_significance === 'critical')
      .append('circle')
      .attr('r', d => SIGNIFICANCE_RADIUS[d.clinical_significance] + 4)
      .attr('fill', d => EVENT_COLORS[d.event_type] || '#6b7280')
      .attr('opacity', 0.3)
      .attr('class', 'glow');

    // Add main circles
    nodes.append('circle')
      .attr('r', d => SIGNIFICANCE_RADIUS[d.clinical_significance])
      .attr('fill', d => EVENT_COLORS[d.event_type] || '#6b7280')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('class', 'node-circle')
      .style('transition', 'all 0.2s ease');

    // Add selected indicator
    nodes.filter(d => d.id === selectedEventId)
      .append('circle')
      .attr('r', d => SIGNIFICANCE_RADIUS[d.clinical_significance] + 6)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '4,2');

    // Add event type icons (for larger nodes)
    nodes.filter(d => ['critical', 'high'].includes(d.clinical_significance))
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .text(d => {
        const typeInitials: Record<string, string> = {
          encounter: 'E',
          diagnosis: 'D',
          lab_result: 'L',
          medication: 'M',
          procedure: 'P',
          imaging: 'I',
          vital_signs: 'V',
          immunization: 'V',
          note: 'N',
        };
        return typeInitials[d.event_type] || '?';
      });

    // Add hover interactions
    nodes
      .on('mouseenter', function(event, d) {
        d3.select(this).select('.node-circle')
          .attr('r', (SIGNIFICANCE_RADIUS[d.clinical_significance] || 8) * 1.3);

        const [x, y] = d3.pointer(event, containerRef.current);
        setTooltipPos({ x: x + 10, y: y - 10 });
        setHoveredEvent(d);
      })
      .on('mouseleave', function(event, d) {
        d3.select(this).select('.node-circle')
          .attr('r', SIGNIFICANCE_RADIUS[d.clinical_significance] || 8);
        setHoveredEvent(null);
      })
      .on('click', function(event, d) {
        onEventSelect?.(d);
      });

    // Add year labels
    const years = [...new Set(sortedEvents.map(e => new Date(e.date).getFullYear()))];
    years.forEach(year => {
      const yearDate = new Date(year, 6, 1);
      const x = transformedXScale(yearDate);
      if (x >= 0 && x <= width) {
        g.append('text')
          .attr('x', x)
          .attr('y', -10)
          .attr('text-anchor', 'middle')
          .attr('fill', '#64748b')
          .attr('font-size', '12px')
          .attr('font-weight', '600')
          .text(year.toString());
      }
    });

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .translateExtent([[0, 0], [dimensions.width, dimensions.height]])
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    svg.call(zoom);

  }, [sortedEvents, dimensions, transform, dateExtent, selectedEventId, onEventSelect]);

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.5, 10]);
    svg.transition().duration(300).call(zoom.scaleBy, 1.5);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.5, 10]);
    svg.transition().duration(300).call(zoom.scaleBy, 0.67);
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.5, 10]);
    svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    setTransform(d3.zoomIdentity);
  };

  // Event type statistics
  const eventStats = useMemo(() => {
    const stats: Record<string, number> = {};
    events.forEach(e => {
      stats[e.event_type] = (stats[e.event_type] || 0) + 1;
    });
    return stats;
  }, [events]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Interactive Medical Timeline</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {events.length} events from {format(dateExtent[0], 'MMM yyyy')} to {format(dateExtent[1], 'MMM yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(eventStats).map(([type, count]) => (
            <Badge
              key={type}
              variant="outline"
              className="flex items-center gap-1.5"
              style={{ borderColor: EVENT_COLORS[type], color: EVENT_COLORS[type] }}
            >
              {EVENT_ICONS[type]}
              <span className="capitalize">{type.replace('_', ' ')}</span>
              <span className="ml-1 px-1.5 py-0.5 bg-muted rounded text-xs">
                {count}
              </span>
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="relative" ref={containerRef}>
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible"
        />

        {/* Tooltip */}
        {hoveredEvent && (
          <div
            className="absolute z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border p-3 pointer-events-none max-w-xs"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: EVENT_COLORS[hoveredEvent.event_type] }}
              />
              <span className="font-medium capitalize">
                {hoveredEvent.event_type.replace('_', ' ')}
              </span>
              <Badge variant={hoveredEvent.clinical_significance as any} className="text-xs">
                {hoveredEvent.clinical_significance}
              </Badge>
            </div>
            <p className="text-sm font-medium">{hoveredEvent.summary}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {format(parseISO(hoveredEvent.date), 'MMMM d, yyyy h:mm a')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
