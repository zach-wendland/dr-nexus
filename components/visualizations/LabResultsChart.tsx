'use client';

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  ReferenceArea,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import type { LabResult } from '@/lib/store';

interface LabResultsChartProps {
  labResults: LabResult[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'CBC': '#3b82f6',
  'WBC Differential': '#8b5cf6',
  'Electrolytes': '#10b981',
  'Metabolic': '#f59e0b',
  'Kidney': '#06b6d4',
  'Liver': '#ec4899',
  'Lipids': '#84cc16',
  'Coagulation': '#ef4444',
  'Thyroid': '#6366f1',
};

const INTERPRETATION_COLORS: Record<string, string> = {
  normal: '#10b981',
  low: '#3b82f6',
  high: '#f59e0b',
  critical_low: '#ef4444',
  critical_high: '#ef4444',
  abnormal: '#8b5cf6',
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-xl border">
      <p className="font-medium mb-2">{payload[0]?.payload?.test_name}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Value:</span>
          <span className="font-semibold">
            {payload[0]?.value} {payload[0]?.payload?.unit}
          </span>
        </div>
        {payload[0]?.payload?.reference_range_low !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Reference:</span>
            <span className="text-sm">
              {payload[0]?.payload?.reference_range_low} - {payload[0]?.payload?.reference_range_high} {payload[0]?.payload?.unit}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge
            variant={payload[0]?.payload?.interpretation === 'normal' ? 'success' : 'warning'}
            className="capitalize"
          >
            {payload[0]?.payload?.interpretation || 'normal'}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {format(parseISO(payload[0]?.payload?.test_date), 'MMM d, yyyy h:mm a')}
        </div>
      </div>
    </div>
  );
}

export function LabResultsChart({ labResults }: LabResultsChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Group by category
  const categories = useMemo(() => {
    const cats = new Set<string>();
    labResults.forEach(r => cats.add(r.category));
    return ['all', ...Array.from(cats)];
  }, [labResults]);

  // Filter by selected category
  const filteredResults = useMemo(() => {
    if (selectedCategory === 'all') return labResults;
    return labResults.filter(r => r.category === selectedCategory);
  }, [labResults, selectedCategory]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredResults.length;
    const normal = filteredResults.filter(r => r.interpretation === 'normal').length;
    const abnormal = total - normal;
    const critical = filteredResults.filter(r =>
      r.interpretation === 'critical_low' || r.interpretation === 'critical_high'
    ).length;
    return { total, normal, abnormal, critical };
  }, [filteredResults]);

  // Chart data for combined view
  const chartData = useMemo(() => {
    return filteredResults.map(result => ({
      ...result,
      displayName: result.test_name.length > 20
        ? result.test_name.substring(0, 17) + '...'
        : result.test_name,
      valueNormalized: result.value && result.reference_range_high
        ? (result.value / result.reference_range_high) * 100
        : result.value,
      isAbnormal: result.interpretation !== 'normal',
    }));
  }, [filteredResults]);

  // Group results by test for trending
  const trendData = useMemo(() => {
    const byTest: Record<string, LabResult[]> = {};
    labResults.forEach(result => {
      if (!byTest[result.test_name]) byTest[result.test_name] = [];
      byTest[result.test_name].push(result);
    });
    return byTest;
  }, [labResults]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg dark:bg-emerald-900">
              <FlaskConical className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Laboratory Results</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.total} tests analyzed
              </p>
            </div>
          </div>

          {/* Stats badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                {stats.normal} Normal
              </span>
            </div>
            {stats.abnormal > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {stats.abnormal} Abnormal
                </span>
              </div>
            )}
            {stats.critical > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                  {stats.critical} Critical
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="capitalize"
            >
              {cat === 'all' ? 'All Categories' : cat}
              {cat !== 'all' && (
                <span className="ml-1 px-1.5 py-0.5 bg-background/20 rounded text-xs">
                  {labResults.filter(r => r.category === cat).length}
                </span>
              )}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="values">Values Chart</TabsTrigger>
            <TabsTrigger value="table">Detailed Table</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Results by interpretation */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 'auto']} />
                  <YAxis
                    type="category"
                    dataKey="displayName"
                    width={150}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="values" className="space-y-4">
            {/* Normalized values chart with reference ranges */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="displayName"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceArea y1={0} y2={100} fill="#dcfce7" fillOpacity={0.3} />
                  <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="5 5" label="Upper Limit" />
                  <Bar
                    dataKey="valueNormalized"
                    name="% of Reference Range"
                    fill={(entry: any) => entry.isAbnormal ? '#f59e0b' : '#10b981'}
                    radius={[4, 4, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="table">
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Test Name</th>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-right p-3 font-medium">Value</th>
                    <th className="text-right p-3 font-medium">Reference Range</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result, idx) => (
                    <tr key={result.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                      <td className="p-3 font-medium">{result.test_name}</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: CATEGORY_COLORS[result.category],
                            color: CATEGORY_COLORS[result.category]
                          }}
                        >
                          {result.category}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-mono">
                        {result.value} {result.unit}
                      </td>
                      <td className="p-3 text-right text-muted-foreground text-sm">
                        {result.reference_range_low !== undefined
                          ? `${result.reference_range_low} - ${result.reference_range_high} ${result.unit}`
                          : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={result.interpretation === 'normal' ? 'success' : 'warning'}
                          className="capitalize"
                        >
                          {result.interpretation === 'normal' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {result.interpretation === 'high' && <TrendingUp className="w-3 h-3 mr-1" />}
                          {result.interpretation === 'low' && <TrendingDown className="w-3 h-3 mr-1" />}
                          {result.interpretation || 'normal'}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {format(parseISO(result.test_date), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
