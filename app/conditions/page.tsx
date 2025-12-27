'use client';

import React from 'react';
import { ConditionsTracker } from '@/components/visualizations/ConditionsTracker';
import { useMedicalStore } from '@/lib/store';
import { Stethoscope } from 'lucide-react';

export default function ConditionsPage() {
  const { conditions, clinicalPhases } = useMedicalStore();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-purple-600" />
          Medical Conditions
        </h1>
        <p className="text-muted-foreground mt-1">
          Track condition history, severity, and clinical journey
        </p>
      </div>

      <ConditionsTracker conditions={conditions} phases={clinicalPhases} />
    </div>
  );
}
