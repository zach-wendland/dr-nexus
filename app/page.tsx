'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  FlaskConical,
  Heart,
  Pill,
  Stethoscope,
  TrendingUp,
  User,
  Zap
} from 'lucide-react';
import { useMedicalStore } from '@/lib/store';
import { getStatistics, CLINICAL_PHASES, ACTION_ITEMS } from '@/lib/medical-data';

export default function DashboardPage() {
  const { patient, conditions, devices, timeline, labResults, medications, actionItems } = useMedicalStore();
  const stats = getStatistics();

  const highPriorityActions = ACTION_ITEMS.filter(a => a.priority === 'high');
  const recentEvents = timeline.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 rounded-2xl p-8 text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">{patient?.name || 'Loading...'}</h1>
              <div className="flex flex-wrap gap-4 text-blue-100">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Age {patient?.age || 30}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {patient?.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'Male'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4" />
                  {patient?.contact?.city || 'Albany'}, {patient?.contact?.state || 'GA'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
              <div className="text-xs text-blue-100 mb-1">Total Events</div>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
              <div className="text-xs text-blue-100 mb-1">Conditions</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {stats.conditions.total}
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
              <div className="text-xs text-blue-100 mb-1">Implants</div>
              <div className="text-2xl font-bold">{stats.devices.total}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
              <div className="text-xs text-blue-100 mb-1">Years of Data</div>
              <div className="text-2xl font-bold">{stats.timespan.years}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Links */}
        <div className="space-y-6">
          {/* Navigation Cards */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Quick Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: '/timeline', icon: <Calendar className="w-5 h-5" />, label: 'Timeline', count: stats.totalEvents, color: 'blue' },
                { href: '/conditions', icon: <Stethoscope className="w-5 h-5" />, label: 'Conditions', count: stats.conditions.total, color: 'purple' },
                { href: '/labs', icon: <FlaskConical className="w-5 h-5" />, label: 'Lab Results', count: stats.labResults.total, color: 'green' },
                { href: '/devices', icon: <Cpu className="w-5 h-5" />, label: 'Implants', count: stats.devices.total, color: 'cyan' },
                { href: '/actions', icon: <AlertCircle className="w-5 h-5" />, label: 'Action Items', count: stats.actionItems.total, color: 'red' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${item.color}-100 dark:bg-${item.color}-900 text-${item.color}-600`}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{item.count}</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recovery Status */}
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-5 h-5" />
                Recovery Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-700 dark:text-emerald-300">All Conditions</span>
                <Badge variant="success">Resolved</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-700 dark:text-emerald-300">Spinal Hardware</span>
                <Badge variant="info">Active - Stable</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-700 dark:text-emerald-300">Functional Status</span>
                <span className="text-sm font-bold text-emerald-600">Excellent</span>
              </div>
              <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  Full recovery achieved after 4+ years
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Action Items */}
        <div className="space-y-6">
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="w-5 h-5" />
                High Priority Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {highPriorityActions.map((item, idx) => (
                <div key={idx} className="p-3 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {item.status === 'pending' ? (
                        <Clock className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Activity className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        <Badge
                          variant={item.status === 'pending' ? 'warning' : 'info'}
                          className="text-xs capitalize"
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{item.item}</p>
                    </div>
                  </div>
                </div>
              ))}
              <Link href="/actions">
                <Button variant="outline" className="w-full mt-2">
                  View All Action Items
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Spinal Hardware */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Spinal Hardware Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-3">Cervical Fusion System (C4-C5)</div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                    <span>39mm Locking Plate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                    <span>Intervertebral Cage (15mm)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                    <span>6 Titanium Screws (4.0x14mm)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                    <span>2 Spacers (Expandable + 5mm)</span>
                  </li>
                </ul>
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-muted-foreground">
                    Implanted: January 15, 2020 - Status: Stable
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Clinical Journey */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Clinical Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {CLINICAL_PHASES.map((phase, idx) => (
                  <div key={idx} className="relative pl-6 pb-4 last:pb-0">
                    {idx !== CLINICAL_PHASES.length - 1 && (
                      <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-green-500" />
                    )}
                    <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-white shadow-sm" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{phase.phase.split(':')[0]}</span>
                      </div>
                      <Badge variant="secondary" className="mb-2 text-xs">{phase.period}</Badge>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {phase.events[0]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/conditions">
                <Button variant="outline" className="w-full mt-4">
                  View Full Timeline
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Lab Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-green-600" />
                Lab Results Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.labResults.normal}</div>
                  <div className="text-xs text-muted-foreground">Normal</div>
                </div>
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{stats.labResults.abnormal}</div>
                  <div className="text-xs text-muted-foreground">Abnormal</div>
                </div>
              </div>
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-1">Latest Panel</div>
                <div className="text-xs text-muted-foreground">
                  CBC with Differential, BMP, Coagulation Studies
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  April 9, 2021
                </div>
              </div>
              <Link href="/labs">
                <Button variant="outline" className="w-full mt-3">
                  View All Lab Results
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
