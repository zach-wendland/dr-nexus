'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ListTodo,
  AlertTriangle,
  Target,
  Calendar
} from 'lucide-react';
import type { ActionItem, UnresolvedQuestion } from '@/lib/store';

interface ActionItemsPanelProps {
  actionItems: ActionItem[];
  unresolvedQuestions: UnresolvedQuestion[];
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200',
  critical: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  ongoing: <Target className="w-4 h-4 text-blue-500" />,
  completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
};

export function ActionItemsPanel({ actionItems, unresolvedQuestions }: ActionItemsPanelProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Stats
  const stats = useMemo(() => ({
    total: actionItems.length,
    high: actionItems.filter(a => a.priority === 'high').length,
    pending: actionItems.filter(a => a.status === 'pending').length,
    ongoing: actionItems.filter(a => a.status === 'ongoing').length,
    questions: unresolvedQuestions.length,
    criticalQuestions: unresolvedQuestions.filter(q => q.importance === 'critical').length,
  }), [actionItems, unresolvedQuestions]);

  // Group by priority
  const byPriority = useMemo(() => {
    const groups: Record<string, ActionItem[]> = { high: [], medium: [], low: [] };
    actionItems.forEach(item => {
      if (groups[item.priority]) {
        groups[item.priority].push(item);
      }
    });
    return groups;
  }, [actionItems]);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border-red-200 dark:border-red-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 dark:text-red-300">High Priority</p>
                <p className="text-2xl font-bold text-red-800 dark:text-red-200">{stats.high}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300">Pending</p>
                <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Ongoing</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.ongoing}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300">Questions</p>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{stats.questions}</p>
              </div>
              <HelpCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="actions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <ListTodo className="w-4 h-4" />
            Action Items ({actionItems.length})
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Unresolved Questions ({unresolvedQuestions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="space-y-4 mt-4">
          {['high', 'medium', 'low'].map(priority => {
            const items = byPriority[priority];
            if (!items || items.length === 0) return null;

            return (
              <Card key={priority}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Badge className={PRIORITY_COLORS[priority]}>
                      {priority.toUpperCase()}
                    </Badge>
                    Priority Actions ({items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div
                        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors flex items-start justify-between"
                        onClick={() => toggleExpand(item.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {STATUS_ICONS[item.status]}
                            <Badge variant="outline" className="capitalize text-xs">
                              {item.category}
                            </Badge>
                            <Badge
                              variant={item.status === 'pending' ? 'warning' : item.status === 'ongoing' ? 'info' : 'success'}
                              className="capitalize text-xs"
                            >
                              {item.status}
                            </Badge>
                          </div>
                          <h4 className="font-medium">{item.item}</h4>
                          {item.rationale && (
                            <p className="text-sm text-muted-foreground mt-1 italic">
                              {item.rationale}
                            </p>
                          )}
                        </div>
                        {expandedItems.has(item.id) ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>

                      {expandedItems.has(item.id) && (
                        <div className="px-4 pb-4 pt-0 space-y-3 bg-muted/30">
                          {item.requirements && item.requirements.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Requirements
                              </p>
                              <ul className="space-y-1">
                                {item.requirements.map((req, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {(item.timeline || item.frequency) && (
                            <div className="flex items-center gap-4 text-sm">
                              {item.timeline && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  <span>Timeline: {item.timeline}</span>
                                </div>
                              )}
                              {item.frequency && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  <span>Frequency: {item.frequency}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="questions" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                Questions Requiring Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {unresolvedQuestions.map(question => (
                <div
                  key={question.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={PRIORITY_COLORS[question.importance]}>
                        {question.importance.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {question.category}
                      </Badge>
                    </div>
                  </div>

                  <h4 className="font-semibold text-lg mb-2">{question.question}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{question.details}</p>

                  {question.required_action && (
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-md p-3 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Required Action:</span>
                        <span className="text-muted-foreground">{question.required_action}</span>
                      </p>
                    </div>
                  )}

                  {question.impact && (
                    <div className="mt-2 bg-amber-50 dark:bg-amber-950 rounded-md p-3 border border-amber-200 dark:border-amber-800">
                      <p className="text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="font-medium">Impact:</span>
                        <span className="text-muted-foreground">{question.impact}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
