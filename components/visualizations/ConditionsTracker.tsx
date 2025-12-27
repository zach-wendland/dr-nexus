'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, parseISO, differenceInMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';
import type { Condition, ClinicalPhase } from '@/lib/store';

interface ConditionsTrackerProps {
  conditions: Condition[];
  phases: ClinicalPhase[];
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  severe: '#f97316',
  moderate: '#f59e0b',
  mild: '#84cc16',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#3b82f6',
  resolved: '#10b981',
  inactive: '#6b7280',
  recurrence: '#ef4444',
};

export function ConditionsTracker({ conditions, phases }: ConditionsTrackerProps) {
  // Group by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    conditions.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [conditions]);

  // Group by severity
  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    conditions.forEach(c => {
      if (c.severity) {
        counts[c.severity] = (counts[c.severity] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: SEVERITY_COLORS[name]
    }));
  }, [conditions]);

  // Timeline data
  const timelineData = useMemo(() => {
    const data: Array<{ date: string; active: number; resolved: number }> = [];

    // Generate monthly data points
    const sortedConditions = [...conditions].sort((a, b) => {
      const dateA = a.onset_date ? new Date(a.onset_date).getTime() : 0;
      const dateB = b.onset_date ? new Date(b.onset_date).getTime() : 0;
      return dateA - dateB;
    });

    if (sortedConditions.length === 0) return data;

    const firstDate = sortedConditions[0].onset_date ? new Date(sortedConditions[0].onset_date) : new Date();
    const lastDate = new Date();
    const months = differenceInMonths(lastDate, firstDate);

    for (let i = 0; i <= Math.min(months, 120); i += 6) { // Every 6 months, max 10 years
      const checkDate = new Date(firstDate);
      checkDate.setMonth(checkDate.getMonth() + i);

      let active = 0;
      let resolved = 0;

      conditions.forEach(c => {
        const onsetDate = c.onset_date ? new Date(c.onset_date) : null;
        const resolutionDate = c.resolution_date ? new Date(c.resolution_date) : null;

        if (onsetDate && onsetDate <= checkDate) {
          if (resolutionDate && resolutionDate <= checkDate) {
            resolved++;
          } else {
            active++;
          }
        }
      });

      data.push({
        date: format(checkDate, 'MMM yyyy'),
        active,
        resolved,
      });
    }

    return data;
  }, [conditions]);

  const resolvedCount = conditions.filter(c => c.status === 'resolved').length;
  const activeCount = conditions.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Conditions</p>
                <p className="text-3xl font-bold">{conditions.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-3xl font-bold text-green-600">{resolvedCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full dark:bg-green-900">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold text-blue-600">{activeCount}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full dark:bg-amber-900">
                <Activity className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recovery Rate</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {conditions.length > 0 ? Math.round((resolvedCount / conditions.length) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full dark:bg-emerald-900">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Condition Status Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Condition Status Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="active"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#93c5fd"
                    name="Active Conditions"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stackId="1"
                    stroke="#10b981"
                    fill="#6ee7b7"
                    name="Resolved Conditions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Severity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {severityCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conditions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            All Conditions ({conditions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conditions.map(condition => (
              <div
                key={condition.id}
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold">{condition.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {condition.icd10_code && (
                        <Badge variant="outline" className="text-xs font-mono">
                          ICD-10: {condition.icd10_code}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={condition.status === 'resolved' ? 'success' : 'info'}
                      className="capitalize"
                    >
                      {condition.status}
                    </Badge>
                    {condition.severity && (
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: SEVERITY_COLORS[condition.severity],
                          color: SEVERITY_COLORS[condition.severity]
                        }}
                        className="capitalize"
                      >
                        {condition.severity}
                      </Badge>
                    )}
                  </div>
                </div>

                {(condition.onset_date || condition.resolution_date) && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                    {condition.onset_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Onset: {format(parseISO(condition.onset_date), 'MMM yyyy')}
                      </span>
                    )}
                    {condition.resolution_date && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        Resolved: {format(parseISO(condition.resolution_date), 'MMM yyyy')}
                      </span>
                    )}
                  </div>
                )}

                {condition.notes && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {condition.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clinical Phases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Clinical Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {phases.map((phase, idx) => (
              <div key={idx} className="relative pl-8 pb-8 last:pb-0">
                {/* Timeline line */}
                {idx !== phases.length - 1 && (
                  <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-green-500" />
                )}

                {/* Timeline node */}
                <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-4 border-white shadow-md flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{idx + 1}</span>
                </div>

                {/* Content */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-lg">{phase.phase}</h4>
                    <Badge variant="secondary">{phase.period}</Badge>
                  </div>
                  <ul className="space-y-1">
                    {phase.events.map((event, eidx) => (
                      <li key={eidx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-blue-500 mt-1">-</span>
                        {event}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
