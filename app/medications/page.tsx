'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMedicalStore } from '@/lib/store';
import { format, parseISO } from 'date-fns';
import {
  Pill,
  Calendar,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function MedicationsPage() {
  const { medications } = useMedicalStore();

  const activeMeds = medications.filter(m => m.status === 'active');
  const inactiveMeds = medications.filter(m => m.status !== 'active');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Pill className="w-8 h-8 text-purple-600" />
          Medications
        </h1>
        <p className="text-muted-foreground mt-1">
          Current and historical medication management
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Medications</p>
                <p className="text-3xl font-bold">{medications.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full dark:bg-purple-900">
                <Pill className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold text-green-600">{activeMeds.length}</p>
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
                <p className="text-sm text-muted-foreground">Discontinued</p>
                <p className="text-3xl font-bold text-gray-600">{inactiveMeds.length}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full dark:bg-gray-800">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Medications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Active Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMeds.map((med) => (
              <div
                key={med.id}
                className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{med.medication_name}</h3>
                    {med.dosage && (
                      <p className="text-sm text-muted-foreground">{med.dosage}</p>
                    )}
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  {med.frequency && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Frequency:</span>
                      <span>{med.frequency}</span>
                    </div>
                  )}
                  {med.route && (
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Route:</span>
                      <span>{med.route}</span>
                    </div>
                  )}
                  {med.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Started:</span>
                      <span>{format(parseISO(med.start_date), 'MMMM d, yyyy')}</span>
                    </div>
                  )}
                  {med.indication && (
                    <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                      <span className="text-muted-foreground">Indication: </span>
                      <span>{med.indication}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {activeMeds.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active medications on file</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-5 h-5" />
            Medication Considerations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
            <h4 className="font-medium mb-1">Stroke Prevention</h4>
            <p className="text-sm text-muted-foreground">
              Daily low-dose aspirin (81mg) recommended for secondary stroke prevention.
              Consult physician before any changes to antiplatelet therapy.
            </p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
            <h4 className="font-medium mb-1">Post-Surgical Considerations</h4>
            <p className="text-sm text-muted-foreground">
              Following cervical fusion, NSAIDs should be used cautiously as they may
              interfere with bone healing. Consult surgeon before taking anti-inflammatory medications.
            </p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
            <h4 className="font-medium mb-1">MRI Compatibility</h4>
            <p className="text-sm text-muted-foreground">
              Titanium spinal hardware is generally MRI-safe. Always inform radiologists
              about implanted devices before imaging procedures.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
