'use client';

import React, { useState } from 'react';
import { InteractiveTimeline } from '@/components/visualizations/InteractiveTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMedicalStore } from '@/lib/store';
import { format, parseISO } from 'date-fns';
import {
  Calendar,
  X,
  ChevronRight,
  Stethoscope,
  AlertCircle,
  FlaskConical,
  Pill,
  Scissors,
  ScanLine,
  Activity,
  Syringe
} from 'lucide-react';
import type { TimelineEvent } from '@/lib/store';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  encounter: <Stethoscope className="w-5 h-5" />,
  diagnosis: <AlertCircle className="w-5 h-5" />,
  lab_result: <FlaskConical className="w-5 h-5" />,
  medication: <Pill className="w-5 h-5" />,
  procedure: <Scissors className="w-5 h-5" />,
  imaging: <ScanLine className="w-5 h-5" />,
  vital_signs: <Activity className="w-5 h-5" />,
  immunization: <Syringe className="w-5 h-5" />,
};

const EVENT_COLORS: Record<string, string> = {
  encounter: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  diagnosis: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  lab_result: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  medication: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  procedure: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  imaging: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  vital_signs: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  immunization: 'bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300',
};

export default function TimelinePage() {
  const { timeline } = useMedicalStore();
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const handleEventSelect = (event: TimelineEvent) => {
    setSelectedEvent(event);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            Medical Timeline
          </h1>
          <p className="text-muted-foreground mt-1">
            Interactive visualization of all {timeline.length} medical events
          </p>
        </div>
      </div>

      {/* Interactive D3 Timeline */}
      <InteractiveTimeline
        events={timeline}
        onEventSelect={handleEventSelect}
        selectedEventId={selectedEvent?.id}
      />

      {/* Event Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Event Details */}
        <div className="lg:col-span-1">
          <Card className={selectedEvent ? 'ring-2 ring-blue-500' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Event Details
                {selectedEvent && (
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEvent ? (
                <div className="space-y-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${EVENT_COLORS[selectedEvent.event_type]}`}>
                    {EVENT_ICONS[selectedEvent.event_type]}
                    <span className="font-medium capitalize">
                      {selectedEvent.event_type.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg">{selectedEvent.summary}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(parseISO(selectedEvent.date), 'MMMM d, yyyy h:mm a')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={selectedEvent.clinical_significance === 'critical' ? 'destructive' :
                               selectedEvent.clinical_significance === 'high' ? 'warning' : 'secondary'}
                      className="capitalize"
                    >
                      {selectedEvent.clinical_significance} significance
                    </Badge>
                  </div>

                  {selectedEvent.provider && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Provider</p>
                      <p className="text-sm font-medium">{selectedEvent.provider}</p>
                    </div>
                  )}

                  {selectedEvent.location && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
                      <p className="text-sm font-medium">{selectedEvent.location}</p>
                    </div>
                  )}

                  {Object.keys(selectedEvent.details).length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Details</p>
                      <div className="space-y-1">
                        {Object.entries(selectedEvent.details).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>{' '}
                            <span className="font-medium">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEvent.codes && Object.keys(selectedEvent.codes).length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Codes</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedEvent.codes).map(([system, code]) => (
                          <Badge key={system} variant="outline" className="font-mono text-xs">
                            {system.toUpperCase()}: {code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Click on an event in the timeline to see details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Event List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">All Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2">
                {timeline.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedEvent?.id === event.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${EVENT_COLORS[event.event_type]}`}>
                          {EVENT_ICONS[event.event_type]}
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{event.summary}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(event.date), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={event.clinical_significance === 'critical' ? 'destructive' :
                                   event.clinical_significance === 'high' ? 'warning' : 'outline'}
                          className="capitalize text-xs"
                        >
                          {event.clinical_significance}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
