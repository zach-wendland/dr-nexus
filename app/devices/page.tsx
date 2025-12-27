'use client';

import React from 'react';
import { DeviceTracker } from '@/components/visualizations/DeviceTracker';
import { useMedicalStore } from '@/lib/store';
import { Cpu } from 'lucide-react';

export default function DevicesPage() {
  const { devices } = useMedicalStore();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Cpu className="w-8 h-8 text-cyan-600" />
          Implanted Devices
        </h1>
        <p className="text-muted-foreground mt-1">
          Track all implanted hardware with body location mapping
        </p>
      </div>

      <DeviceTracker devices={devices} />
    </div>
  );
}
