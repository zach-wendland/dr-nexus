'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Calendar,
  Stethoscope,
  FlaskConical,
  Pill,
  Cpu,
  ListTodo,
  HelpCircle,
  FileText,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMedicalStore } from '@/lib/store';

interface SearchResult {
  id: string;
  type: 'timeline' | 'condition' | 'lab' | 'medication' | 'device' | 'action' | 'question';
  title: string;
  subtitle?: string;
  date?: string;
  significance?: 'low' | 'medium' | 'high' | 'critical';
  href: string;
}

const TYPE_CONFIG = {
  timeline: { icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900', label: 'Timeline Event' },
  condition: { icon: Stethoscope, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900', label: 'Condition' },
  lab: { icon: FlaskConical, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900', label: 'Lab Result' },
  medication: { icon: Pill, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900', label: 'Medication' },
  device: { icon: Cpu, color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900', label: 'Device' },
  action: { icon: ListTodo, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900', label: 'Action Item' },
  question: { icon: HelpCircle, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900', label: 'Question' }
};

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const {
    timeline,
    conditions,
    labResults,
    medications,
    devices,
    actionItems,
    unresolvedQuestions
  } = useMedicalStore();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Search function
  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search timeline events
    timeline.forEach((event) => {
      const matches =
        event.summary?.toLowerCase().includes(lowerQuery) ||
        event.event_type.toLowerCase().includes(lowerQuery) ||
        JSON.stringify(event.details).toLowerCase().includes(lowerQuery);

      if (matches) {
        results.push({
          id: event.id,
          type: 'timeline',
          title: event.summary || 'Unknown Event',
          subtitle: event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1),
          date: event.date,
          significance: event.clinical_significance,
          href: '/timeline'
        });
      }
    });

    // Search conditions
    conditions.forEach((condition) => {
      const matches =
        condition.name.toLowerCase().includes(lowerQuery) ||
        condition.icd10_code?.toLowerCase().includes(lowerQuery) ||
        condition.notes?.toLowerCase().includes(lowerQuery);

      if (matches) {
        results.push({
          id: condition.id,
          type: 'condition',
          title: condition.name,
          subtitle: `${condition.status} | ${condition.icd10_code || 'No code'}`,
          date: condition.onset_date || undefined,
          significance: condition.severity === 'critical' ? 'critical' : condition.severity === 'severe' ? 'high' : 'medium',
          href: '/conditions'
        });
      }
    });

    // Search lab results
    labResults.forEach((lab) => {
      const matches =
        lab.test_name.toLowerCase().includes(lowerQuery) ||
        lab.loinc_code?.toLowerCase().includes(lowerQuery) ||
        lab.category?.toLowerCase().includes(lowerQuery);

      if (matches) {
        results.push({
          id: lab.id,
          type: 'lab',
          title: lab.test_name,
          subtitle: `${lab.value} ${lab.unit || ''} | ${lab.interpretation}`,
          date: lab.test_date,
          significance: lab.interpretation === 'critical' ? 'critical' : lab.interpretation === 'high' || lab.interpretation === 'low' ? 'medium' : 'low',
          href: '/labs'
        });
      }
    });

    // Search medications
    medications.forEach((med) => {
      const matches =
        med.medication_name.toLowerCase().includes(lowerQuery) ||
        med.indication?.toLowerCase().includes(lowerQuery) ||
        med.dosage?.toLowerCase().includes(lowerQuery);

      if (matches) {
        results.push({
          id: med.id,
          type: 'medication',
          title: med.medication_name,
          subtitle: `${med.dosage || ''} ${med.frequency || ''} | ${med.status}`,
          date: med.start_date || undefined,
          significance: med.status === 'active' ? 'medium' : 'low',
          href: '/medications'
        });
      }
    });

    // Search devices
    devices.forEach((device) => {
      const matches =
        device.device_name.toLowerCase().includes(lowerQuery) ||
        device.device_type.toLowerCase().includes(lowerQuery) ||
        device.body_location?.toLowerCase().includes(lowerQuery) ||
        device.manufacturer?.toLowerCase().includes(lowerQuery);

      if (matches) {
        results.push({
          id: device.id,
          type: 'device',
          title: device.device_name,
          subtitle: `${device.body_location || 'Unknown location'} | ${device.status}`,
          date: device.implant_date || undefined,
          significance: 'medium',
          href: '/devices'
        });
      }
    });

    // Search action items
    actionItems.forEach((action) => {
      const matches =
        action.item.toLowerCase().includes(lowerQuery) ||
        action.category?.toLowerCase().includes(lowerQuery) ||
        action.rationale?.toLowerCase().includes(lowerQuery);

      if (matches) {
        results.push({
          id: action.id,
          type: 'action',
          title: action.item,
          subtitle: `${action.category} | ${action.priority} priority`,
          significance: action.priority === 'high' ? 'high' : action.priority === 'medium' ? 'medium' : 'low',
          href: '/actions'
        });
      }
    });

    // Search unresolved questions
    unresolvedQuestions.forEach((question) => {
      const matches =
        question.question.toLowerCase().includes(lowerQuery) ||
        question.category?.toLowerCase().includes(lowerQuery) ||
        question.details?.toLowerCase().includes(lowerQuery);

      if (matches) {
        results.push({
          id: question.id,
          type: 'question',
          title: question.question,
          subtitle: question.category,
          significance: question.importance === 'critical' ? 'critical' : question.importance === 'high' ? 'high' : 'medium',
          href: '/actions'
        });
      }
    });

    // Sort by significance
    const significanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return results.sort((a, b) =>
      (significanceOrder[a.significance || 'low'] || 3) - (significanceOrder[b.significance || 'low'] || 3)
    );
  }, [query, timeline, conditions, labResults, medications, devices, actionItems, unresolvedQuestions]);

  const handleSelect = useCallback((result: SearchResult) => {
    // Save to recent searches
    const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));

    router.push(result.href);
    onClose();
    setQuery('');
  }, [query, recentSearches, router, onClose]);

  const handleRecentSearch = useCallback((search: string) => {
    setQuery(search);
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-card rounded-xl shadow-2xl border overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medical records, conditions, labs, medications..."
            className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-muted-foreground"
            autoFocus
          />
          {query && (
            <Button variant="ghost" size="icon" onClick={() => setQuery('')}>
              <X className="w-4 h-4" />
            </Button>
          )}
          <kbd className="hidden md:inline-flex h-6 px-2 items-center gap-1 rounded border bg-muted font-mono text-xs text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results or Recent Searches */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.length < 2 ? (
            // Recent Searches
            <div className="p-4">
              {recentSearches.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Recent Searches</span>
                    <Button variant="ghost" size="sm" onClick={clearRecentSearches} className="text-xs h-7">
                      Clear
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRecentSearch(search)}
                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{search}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>Start typing to search medical records</p>
                  <p className="text-xs mt-1">Search conditions, labs, medications, devices, and more</p>
                </div>
              )}

              {/* Quick Links */}
              <div className="mt-6">
                <span className="text-sm font-medium text-muted-foreground mb-3 block">Quick Links</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Timeline', href: '/timeline', icon: Calendar },
                    { label: 'Conditions', href: '/conditions', icon: Stethoscope },
                    { label: 'Lab Results', href: '/labs', icon: FlaskConical },
                    { label: 'Medications', href: '/medications', icon: Pill },
                    { label: 'Devices', href: '/devices', icon: Cpu },
                    { label: 'Actions', href: '/actions', icon: ListTodo }
                  ].map((link) => (
                    <button
                      key={link.href}
                      onClick={() => { router.push(link.href); onClose(); }}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-sm"
                    >
                      <link.icon className="w-4 h-4 text-muted-foreground" />
                      <span>{link.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No results found for &quot;{query}&quot;</p>
              <p className="text-xs mt-1">Try different keywords or check spelling</p>
            </div>
          ) : (
            <div className="p-2">
              <div className="text-xs text-muted-foreground px-2 mb-2">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </div>
              <div className="space-y-1">
                {searchResults.slice(0, 20).map((result) => {
                  const config = TYPE_CONFIG[result.type];
                  const Icon = config.icon;

                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left group"
                    >
                      <div className={cn('p-2 rounded-lg', config.bgColor)}>
                        <Icon className={cn('w-4 h-4', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{result.title}</span>
                          {result.significance === 'critical' && (
                            <Badge variant="destructive" className="text-xs">Critical</Badge>
                          )}
                          {result.significance === 'high' && (
                            <Badge variant="warning" className="text-xs">High</Badge>
                          )}
                        </div>
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {result.date && (
                          <span>{new Date(result.date).toLocaleDateString()}</span>
                        )}
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono">Enter</kbd>
              to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono">ESC</kbd>
              to close
            </span>
          </div>
          <span>Search powered by Dr. Nexus</span>
        </div>
      </div>
    </div>
  );
}

// Export a hook for keyboard shortcut
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}
