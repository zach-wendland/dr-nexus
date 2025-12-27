'use client';

import React from 'react';
import { LabResultsChart } from '@/components/visualizations/LabResultsChart';
import { useMedicalStore } from '@/lib/store';
import { FlaskConical } from 'lucide-react';

export default function LabsPage() {
  const { labResults } = useMedicalStore();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-green-600" />
          Laboratory Results
        </h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive lab test history with trends and analysis
        </p>
      </div>

      <LabResultsChart labResults={labResults} />
    </div>
  );
}
