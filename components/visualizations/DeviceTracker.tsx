'use client';

import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Cpu,
  CheckCircle2,
  Calendar,
  MapPin,
  Building2,
  Info,
  ChevronRight,
  Layers
} from 'lucide-react';
import type { Device } from '@/lib/store';

interface DeviceTrackerProps {
  devices: Device[];
}

// SVG Body Map Component
function BodyMap({ devices, onDeviceHover, hoveredDeviceId }: {
  devices: Device[];
  onDeviceHover: (id: string | null) => void;
  hoveredDeviceId: string | null;
}) {
  // Cervical spine location for devices
  const cervicalSpineDevices = devices.filter(d =>
    d.body_location?.toLowerCase().includes('cervical') ||
    d.body_location?.toLowerCase().includes('spine')
  );

  return (
    <div className="relative w-full max-w-xs mx-auto">
      <svg
        viewBox="0 0 200 400"
        className="w-full h-auto"
        style={{ maxHeight: '400px' }}
      >
        {/* Head */}
        <ellipse cx="100" cy="40" rx="35" ry="40" fill="#fcd5b5" stroke="#d4a574" strokeWidth="2" />

        {/* Neck */}
        <rect x="85" y="75" width="30" height="30" fill="#fcd5b5" stroke="#d4a574" strokeWidth="2" />

        {/* Torso */}
        <path
          d="M50 105 L150 105 L155 250 L100 270 L45 250 Z"
          fill="#e8d4c4"
          stroke="#d4a574"
          strokeWidth="2"
        />

        {/* Arms */}
        <path
          d="M50 105 L20 110 L10 200 L25 205 L35 160 L45 115"
          fill="#fcd5b5"
          stroke="#d4a574"
          strokeWidth="2"
        />
        <path
          d="M150 105 L180 110 L190 200 L175 205 L165 160 L155 115"
          fill="#fcd5b5"
          stroke="#d4a574"
          strokeWidth="2"
        />

        {/* Legs */}
        <path
          d="M55 250 L50 380 L75 385 L85 260"
          fill="#e8d4c4"
          stroke="#d4a574"
          strokeWidth="2"
        />
        <path
          d="M145 250 L150 380 L125 385 L115 260"
          fill="#e8d4c4"
          stroke="#d4a574"
          strokeWidth="2"
        />

        {/* Spine visualization */}
        <g className="spine">
          {/* Cervical spine vertebrae */}
          {['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'].map((vertebra, idx) => (
            <g key={vertebra}>
              <rect
                x="92"
                y={78 + idx * 4}
                width="16"
                height="3"
                rx="1"
                fill={idx >= 3 && idx <= 4 ? '#3b82f6' : '#94a3b8'}
                stroke={idx >= 3 && idx <= 4 ? '#1d4ed8' : '#64748b'}
                strokeWidth="0.5"
              />
              <text
                x="118"
                y={82 + idx * 4}
                fontSize="6"
                fill="#64748b"
              >
                {vertebra}
              </text>
            </g>
          ))}
        </g>

        {/* Device markers */}
        {cervicalSpineDevices.length > 0 && (
          <g className="device-markers">
            {/* Plate indicator */}
            <rect
              x="88"
              y="88"
              width="24"
              height="12"
              rx="2"
              fill={hoveredDeviceId ? (cervicalSpineDevices.some(d => d.id === hoveredDeviceId) ? '#2563eb' : '#3b82f6') : '#3b82f6'}
              stroke="#1d4ed8"
              strokeWidth="1"
              className="cursor-pointer transition-all"
              onMouseEnter={() => onDeviceHover(cervicalSpineDevices[0]?.id || null)}
              onMouseLeave={() => onDeviceHover(null)}
            />

            {/* Screws */}
            {[0, 1, 2].map(i => (
              <circle
                key={`screw-l-${i}`}
                cx="90"
                cy={90 + i * 4}
                r="1.5"
                fill="#94a3b8"
                stroke="#64748b"
              />
            ))}
            {[0, 1, 2].map(i => (
              <circle
                key={`screw-r-${i}`}
                cx="110"
                cy={90 + i * 4}
                r="1.5"
                fill="#94a3b8"
                stroke="#64748b"
              />
            ))}

            {/* Label line */}
            <line x1="112" y1="94" x2="145" y2="94" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" />
            <text x="148" y="92" fontSize="8" fill="#3b82f6" fontWeight="600">
              ACDF Hardware
            </text>
            <text x="148" y="100" fontSize="6" fill="#64748b">
              C4-C5 Level
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-muted-foreground">Surgical Hardware</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-slate-400" />
          <span className="text-muted-foreground">Vertebrae</span>
        </div>
      </div>
    </div>
  );
}

export function DeviceTracker({ devices }: DeviceTrackerProps) {
  const [hoveredDeviceId, setHoveredDeviceId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const activeDevices = devices.filter(d => d.status === 'active');

  // Group devices by type
  const devicesByType: Record<string, Device[]> = {};
  devices.forEach(d => {
    const type = d.device_type;
    if (!devicesByType[type]) devicesByType[type] = [];
    devicesByType[type].push(d);
  });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Implants</p>
                <p className="text-3xl font-bold">{devices.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900">
                <Cpu className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold text-green-600">{activeDevices.length}</p>
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
                <p className="text-sm text-muted-foreground">Device Types</p>
                <p className="text-3xl font-bold">{Object.keys(devicesByType).length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full dark:bg-purple-900">
                <Layers className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Body Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Implant Location Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BodyMap
              devices={devices}
              onDeviceHover={setHoveredDeviceId}
              hoveredDeviceId={hoveredDeviceId}
            />
          </CardContent>
        </Card>

        {/* Device List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-600" />
              Implanted Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {devices.map(device => (
                <div
                  key={device.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    hoveredDeviceId === device.id || selectedDevice?.id === device.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                  onMouseEnter={() => setHoveredDeviceId(device.id)}
                  onMouseLeave={() => setHoveredDeviceId(null)}
                  onClick={() => setSelectedDevice(selectedDevice?.id === device.id ? null : device)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{device.device_name}</h4>
                        <Badge
                          variant={device.status === 'active' ? 'success' : 'secondary'}
                          className="capitalize"
                        >
                          {device.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{device.device_type}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${
                      selectedDevice?.id === device.id ? 'rotate-90' : ''
                    }`} />
                  </div>

                  {/* Expanded details */}
                  {selectedDevice?.id === device.id && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {device.body_location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Location:</span>
                          <span>{device.body_location}</span>
                        </div>
                      )}
                      {device.implant_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Implanted:</span>
                          <span>{format(parseISO(device.implant_date), 'MMMM d, yyyy')}</span>
                        </div>
                      )}
                      {device.manufacturer && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Manufacturer:</span>
                          <span>{device.manufacturer}</span>
                        </div>
                      )}
                      {device.notes && (
                        <div className="flex items-start gap-2 text-sm">
                          <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span className="text-muted-foreground">{device.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hardware Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cervical Fusion Hardware Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-blue-600">1</div>
                <div className="text-sm text-muted-foreground">Locking Plate</div>
                <div className="text-xs text-muted-foreground mt-1">39mm CSLP</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-purple-600">6</div>
                <div className="text-sm text-muted-foreground">Titanium Screws</div>
                <div className="text-xs text-muted-foreground mt-1">4.0mm x 14mm</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-cyan-600">1</div>
                <div className="text-sm text-muted-foreground">Intervertebral Cage</div>
                <div className="text-xs text-muted-foreground mt-1">15mm Conform</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-emerald-600">2</div>
                <div className="text-sm text-muted-foreground">Spacers</div>
                <div className="text-xs text-muted-foreground mt-1">Expandable + 5mm</div>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              All hardware implanted January 15, 2020 - Currently stable and well-integrated
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
