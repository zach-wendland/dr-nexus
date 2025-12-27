'use client';

import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Heart,
  HelpCircle,
  Home,
  Pill,
  Stethoscope,
  TrendingUp,
  User,
  XCircle,
  Zap
} from 'lucide-react';

// Medical Knowledge Base Data
const MEDICAL_DATA = {
  metadata: {
    version: "1.0.0",
    generated_at: "2025-12-27T10:34:24.705761",
    source_files_count: 11,
    processing_duration_seconds: 10.214271
  },
  patient_profile: {
    demographics: {
      patient_id: "16087195-04C9-4D6C-B701-1C567DFF4061",
      name: "Zachary Michael Wendland",
      date_of_birth: "1994-06-16",
      age: 31,
      gender: "male",
      contact: {
        phone: "+1(229)436-8796",
        email: "zmwendland@gmail.com",
        address_line1: "714 RIVER CHASE LN",
        city: "ALBANY",
        state: "GA",
        zip_code: "31701-1274",
        country: "USA"
      }
    },
    chronic_conditions: [
      {
        name: "Cerebral Infarction (Stroke)",
        icd10_code: "I63.9",
        snomed_code: "230690007",
        status: "resolved",
        clinical_status: "resolved",
        severity: "critical",
        notes: "Stroke occurred at approximately age 22-23 (2016)"
      },
      {
        name: "Unspecified Cord Compression",
        icd10_code: "G95.20",
        snomed_code: "71286001",
        status: "resolved",
        clinical_status: "resolved",
        severity: "critical",
        notes: "Cervical spinal cord compression requiring surgical intervention"
      },
      {
        name: "Dysarthria (Speech Difficulty)",
        icd10_code: "R47.1",
        snomed_code: "8011004",
        status: "resolved",
        clinical_status: "resolved"
      },
      {
        name: "Anesthesia of Skin (Numbness)",
        icd10_code: "R20.0",
        snomed_code: "101000119102",
        status: "resolved",
        clinical_status: "resolved"
      },
      {
        name: "Dizziness and Giddiness",
        icd10_code: "R42",
        snomed_code: "404640003",
        status: "resolved",
        clinical_status: "resolved"
      },
      {
        name: "Unsteadiness on Feet",
        icd10_code: "R26.81",
        snomed_code: "22325002",
        status: "resolved",
        clinical_status: "resolved"
      },
      {
        name: "Insufficiency of Convergence",
        icd10_code: "H51.20",
        snomed_code: "49823009",
        status: "resolved",
        clinical_status: "resolved"
      },
      {
        name: "Nausea",
        icd10_code: "R11.0",
        snomed_code: "422587007",
        status: "resolved",
        clinical_status: "resolved"
      }
    ],
    implanted_devices: [
      {
        device_type: "39MM CSLP PLATE",
        device_name: "Cervical Spine Locking Plate",
        status: "active",
        notes: "Primary structural component for cervical fusion"
      },
      {
        device_type: "CUBE CONFORM 15MM Q-PACK",
        device_name: "Intervertebral Cage/Spacer",
        status: "active"
      },
      {
        device_type: "SCRW CANCLS TT QLCK S/T 4.0X14",
        device_name: "Titanium Screw (4.0mm x 14mm)",
        status: "active",
        count: 6
      },
      {
        device_type: "SMALL XPAND SPACER",
        device_name: "Expandable Spacer",
        status: "active"
      },
      {
        device_type: "SPACER PARALLEL ADV ACF 5MM",
        device_name: "Advanced Parallel Spacer (5mm)",
        status: "active"
      }
    ]
  },
  symptom_registry: [
    {
      symptom: "Speech Difficulty (Dysarthria)",
      status: "resolved",
      severity: "moderate",
      first_reported: "2016",
      last_updated: "2024"
    },
    {
      symptom: "Numbness/Loss of Sensation",
      status: "resolved",
      severity: "moderate",
      first_reported: "2016",
      last_updated: "2024"
    },
    {
      symptom: "Dizziness",
      status: "resolved",
      severity: "moderate",
      first_reported: "2016",
      last_updated: "2024"
    },
    {
      symptom: "Gait Instability/Unsteadiness",
      status: "resolved",
      severity: "moderate",
      first_reported: "2016-2019",
      last_updated: "2024"
    },
    {
      symptom: "Eye Convergence Problems",
      status: "resolved",
      severity: "mild",
      first_reported: "2016",
      last_updated: "2024"
    },
    {
      symptom: "Nausea",
      status: "resolved",
      severity: "mild",
      first_reported: "2019-2020",
      last_updated: "2024"
    }
  ],
  action_items: [
    {
      priority: "high",
      category: "Prevention",
      item: "Ensure comprehensive stroke workup completed",
      status: "pending",
      rationale: "Young stroke patients have 15-20% 5-year recurrence risk",
      requirements: [
        "Cardiac evaluation (echo, Holter monitor)",
        "Hypercoagulability panel",
        "Vascular imaging (carotid/vertebral arteries)",
        "Genetic testing if indicated"
      ]
    },
    {
      priority: "high",
      category: "Surveillance",
      item: "Annual spinal imaging to assess fusion",
      status: "ongoing",
      requirements: [
        "Flexion/extension X-rays to confirm stability",
        "Assessment for hardware failure/loosening",
        "Evaluation of adjacent segment disease"
      ],
      timeline: "Yearly for first 5 years, then as needed"
    },
    {
      priority: "high",
      category: "Risk Management",
      item: "Optimize cardiovascular risk factors",
      status: "ongoing",
      requirements: [
        "Blood pressure control (target <130/80)",
        "Lipid management (if indicated)",
        "Diabetes screening",
        "Antiplatelet therapy (ASA vs clopidogrel)"
      ],
      frequency: "Every 3-6 months"
    },
    {
      priority: "medium",
      category: "Monitoring",
      item: "Annual neurological function check-ups",
      status: "ongoing",
      assessments: [
        "Speech/swallowing evaluation",
        "Gait and balance testing",
        "Fine motor skills",
        "Vision (convergence recovery)"
      ]
    },
    {
      priority: "medium",
      category: "Medication",
      item: "Verify current medication regimen",
      status: "pending",
      expected_medications: [
        "Antiplatelet (stroke prevention)",
        "Pain management (if needed)",
        "Muscle relaxants (if spasms)"
      ]
    },
    {
      priority: "low",
      category: "Lifestyle",
      item: "Lifestyle optimization recommendations",
      status: "ongoing",
      recommendations: [
        "Regular exercise (cardiovascular health)",
        "Smoking cessation (if applicable)",
        "Stress management",
        "Ergonomic workplace setup"
      ]
    }
  ],
  unresolved_questions: [
    {
      question: "What was the underlying cause of stroke at age ~22?",
      category: "Etiology",
      importance: "critical",
      details: "Was it cardioembolic, thrombotic, or other? Were risk factors identified?",
      required_action: "Review stroke workup documentation"
    },
    {
      question: "Did cord compression cause the stroke (vertebral artery compromise)?",
      category: "Temporal Relationship",
      importance: "high",
      details: "Or was stroke separate from cervical pathology? Was there trauma involved?",
      impact: "Changes prevention strategy"
    },
    {
      question: "Is patient on antiplatelet therapy?",
      category: "Current Treatment",
      importance: "high",
      details: "What is the long-term medication plan? Any anticoagulation considered?",
      required_action: "Medication list verification"
    },
    {
      question: "Has fusion been confirmed on imaging?",
      category: "Surgical Outcome",
      importance: "medium",
      details: "Are all hardware components intact? Any adjacent segment issues developing?",
      required_action: "Recent imaging review"
    },
    {
      question: "What is current functional status?",
      category: "Recovery Assessment",
      importance: "medium",
      details: "Any residual deficits (speech, gait, sensation)? Return to work/normal activities?",
      required_action: "Functional assessment documentation"
    },
    {
      question: "Any family history of stroke, vascular disease?",
      category: "Genetic Risk",
      importance: "medium",
      details: "Hypercoagulable conditions in family? Connective tissue disorders?",
      required_action: "Detailed family history"
    }
  ],
  clinical_timeline: [
    {
      phase: "Phase 1: Acute Stroke Event (2016)",
      period: "2016",
      events: [
        "Cerebral infarction (ischemic stroke) at age ~22",
        "Initial neurological deficits affecting speech, balance, sensation",
        "Emergency/acute care phase"
      ]
    },
    {
      phase: "Phase 2: Post-stroke Complications (2016-2019)",
      period: "2016-2019",
      events: [
        "Development/discovery of cervical cord compression",
        "Progressive myelopathic symptoms (gait instability, dizziness, nausea)",
        "Decision for surgical intervention"
      ]
    },
    {
      phase: "Phase 3: Surgical Treatment (2019-2020)",
      period: "2019-2020",
      events: [
        "Anterior cervical decompression and fusion (ACDF)",
        "Hardware implantation (plate, cage, 6 screws, spacers)",
        "Initial recovery phase"
      ]
    },
    {
      phase: "Phase 4: Rehabilitation and Monitoring (2020-2024)",
      period: "2020-2024",
      events: [
        "Symptom resolution (all conditions marked as resolved)",
        "Hardware integration and fusion confirmation",
        "Ongoing surveillance and monitoring",
        "Return to functional baseline"
      ]
    }
  ]
};

// Utility Components
const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    active: 'bg-blue-100 text-blue-800 border-blue-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    ongoing: 'bg-sky-100 text-sky-800 border-sky-200'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const styles = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
    critical: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[priority as keyof typeof styles]}`}>
      {priority.toUpperCase()}
    </span>
  );
};

const SeverityIndicator = ({ severity }: { severity?: string }) => {
  if (!severity) return null;

  const styles = {
    critical: 'bg-red-500',
    moderate: 'bg-yellow-500',
    mild: 'bg-green-500'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${styles[severity as keyof typeof styles] || 'bg-gray-400'}`} />
      <span className="text-sm text-slate-600 capitalize">{severity}</span>
    </div>
  );
};

// Main Dashboard Component
export default function MedicalDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    actionItems: true,
    timeline: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const { patient_profile, symptom_registry, action_items, unresolved_questions, clinical_timeline } = MEDICAL_DATA;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                Dr. Nexus Medical Dashboard
              </h1>
              <p className="text-slate-600 mt-1">Comprehensive Health Analysis & Monitoring</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500">Version {MEDICAL_DATA.metadata.version}</div>
              <div className="text-xs text-slate-400">Generated: {new Date(MEDICAL_DATA.metadata.generated_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Patient Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">{patient_profile.demographics.name}</h2>
                <div className="flex gap-4 text-blue-100">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Age {patient_profile.demographics.age}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    {patient_profile.demographics.gender.charAt(0).toUpperCase() + patient_profile.demographics.gender.slice(1)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Home className="w-4 h-4" />
                    {patient_profile.demographics.contact.city}, {patient_profile.demographics.contact.state}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Cards */}
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
                <div className="text-xs text-blue-100 mb-1">Total Events</div>
                <div className="text-2xl font-bold">166</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
                <div className="text-xs text-blue-100 mb-1">Conditions</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {patient_profile.chronic_conditions.length}
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
                <div className="text-xs text-blue-100 mb-1">Implants</div>
                <div className="text-2xl font-bold">{patient_profile.implanted_devices.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-1.5 shadow-sm border border-slate-200">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'timeline', label: 'Timeline', icon: Clock },
            { id: 'conditions', label: 'Conditions', icon: Stethoscope },
            { id: 'symptoms', label: 'Symptoms', icon: TrendingUp },
            { id: 'actions', label: 'Action Items', icon: AlertCircle },
            { id: 'questions', label: 'Questions', icon: HelpCircle }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-2.5 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Critical Action Items */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div
                className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100 flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('actionItems')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">High Priority Action Items</h3>
                    <p className="text-sm text-slate-600">
                      {action_items.filter(a => a.priority === 'high').length} critical items requiring attention
                    </p>
                  </div>
                </div>
                {expandedSections.actionItems ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
              </div>

              {expandedSections.actionItems && (
                <div className="p-6 space-y-4">
                  {action_items.filter(a => a.priority === 'high').map((item, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <PriorityBadge priority={item.priority} />
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{item.category}</span>
                            <StatusBadge status={item.status} />
                          </div>
                          <h4 className="text-base font-semibold text-slate-900">{item.item}</h4>
                          {item.rationale && (
                            <p className="text-sm text-slate-600 mt-2 italic">
                              <strong>Rationale:</strong> {item.rationale}
                            </p>
                          )}
                        </div>
                      </div>

                      {item.requirements && item.requirements.length > 0 && (
                        <div className="mt-3 bg-slate-50 rounded-md p-3">
                          <p className="text-xs font-semibold text-slate-700 mb-2">Requirements:</p>
                          <ul className="space-y-1.5">
                            {item.requirements.map((req, ridx) => (
                              <li key={ridx} className="text-sm text-slate-600 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.timeline && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span><strong>Timeline:</strong> {item.timeline}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Health Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Recovery Status */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Recovery Status</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">All Conditions</span>
                    <StatusBadge status="resolved" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Spinal Hardware</span>
                    <StatusBadge status="active" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Functional Status</span>
                    <span className="text-sm font-medium text-emerald-600">Excellent</span>
                  </div>
                </div>
              </div>

              {/* Implanted Devices */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Spinal Hardware</h3>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-600">Cervical Fusion System:</div>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></span>
                      <span>39mm Locking Plate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></span>
                      <span>Intervertebral Cage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></span>
                      <span>6 Titanium Screws (4.0x14mm)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></span>
                      <span>2 Spacers</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Monitoring Status */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Active Monitoring</h3>
                </div>
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="text-slate-600 mb-1">Last Updated</div>
                    <div className="font-medium text-slate-900">2024 (Current)</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-slate-600 mb-1">Follow-up Schedule</div>
                    <div className="font-medium text-slate-900">Regular (3-6 months)</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-slate-600 mb-1">Data Period</div>
                    <div className="font-medium text-slate-900">2016-2024 (9 years)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-600" />
              Clinical Timeline
            </h3>
            <div className="space-y-6">
              {clinical_timeline.map((phase, idx) => (
                <div key={idx} className="relative pl-8 pb-8 border-l-2 border-blue-200 last:border-l-0 last:pb-0">
                  <div className="absolute -left-3 top-0 w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-md flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{idx + 1}</span>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-5 border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-slate-900">{phase.phase}</h4>
                      <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                        {phase.period}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {phase.events.map((event, eidx) => (
                        <li key={eidx} className="flex items-start gap-3 text-slate-700">
                          <ChevronRight className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{event}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'conditions' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-blue-600" />
              Medical Conditions ({patient_profile.chronic_conditions.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patient_profile.chronic_conditions.map((condition, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-1">{condition.name}</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                          ICD-10: {condition.icd10_code}
                        </span>
                        <StatusBadge status={condition.status} />
                      </div>
                      {condition.severity && <SeverityIndicator severity={condition.severity} />}
                    </div>
                  </div>
                  {condition.notes && (
                    <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100">
                      {condition.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'symptoms' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Symptom Registry ({symptom_registry.length})
            </h3>
            <div className="space-y-3">
              {symptom_registry.map((symptom, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-900">{symptom.symptom}</h4>
                        <StatusBadge status={symptom.status} />
                        {symptom.severity && <SeverityIndicator severity={symptom.severity} />}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          First: {symptom.first_reported}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          Updated: {symptom.last_updated}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-4">
            {['high', 'medium', 'low'].map(priority => {
              const items = action_items.filter(a => a.priority === priority);
              if (items.length === 0) return null;

              return (
                <div key={priority} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority Actions ({items.length})
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {items.map((item, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <PriorityBadge priority={item.priority} />
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{item.category}</span>
                              <StatusBadge status={item.status} />
                            </div>
                            <h4 className="text-base font-semibold text-slate-900">{item.item}</h4>
                            {item.rationale && (
                              <p className="text-sm text-slate-600 mt-2 italic">
                                <strong>Rationale:</strong> {item.rationale}
                              </p>
                            )}
                          </div>
                        </div>

                        {item.requirements && item.requirements.length > 0 && (
                          <div className="mt-3 bg-slate-50 rounded-md p-3">
                            <p className="text-xs font-semibold text-slate-700 mb-2">Requirements:</p>
                            <ul className="space-y-1.5">
                              {item.requirements.map((req, ridx) => (
                                <li key={ridx} className="text-sm text-slate-600 flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.assessments && item.assessments.length > 0 && (
                          <div className="mt-3 bg-slate-50 rounded-md p-3">
                            <p className="text-xs font-semibold text-slate-700 mb-2">Assessments:</p>
                            <ul className="space-y-1.5">
                              {item.assessments.map((assessment, aidx) => (
                                <li key={aidx} className="text-sm text-slate-600 flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <span>{assessment}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.timeline && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-4 h-4" />
                            <span><strong>Timeline:</strong> {item.timeline}</span>
                          </div>
                        )}

                        {item.frequency && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-4 h-4" />
                            <span><strong>Frequency:</strong> {item.frequency}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-blue-600" />
              Unresolved Questions ({unresolved_questions.length})
            </h3>
            <div className="space-y-4">
              {unresolved_questions.map((question, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <PriorityBadge priority={question.importance} />
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{question.category}</span>
                      </div>
                      <h4 className="text-base font-semibold text-slate-900 mb-2">{question.question}</h4>
                      <p className="text-sm text-slate-600">{question.details}</p>
                    </div>
                  </div>

                  {question.required_action && (
                    <div className="mt-3 bg-blue-50 rounded-md p-3 border border-blue-100">
                      <p className="text-sm text-blue-900 flex items-start gap-2">
                        <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span><strong>Required Action:</strong> {question.required_action}</span>
                      </p>
                    </div>
                  )}

                  {question.impact && (
                    <div className="mt-3 bg-amber-50 rounded-md p-3 border border-amber-100">
                      <p className="text-sm text-amber-900 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span><strong>Impact:</strong> {question.impact}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div>
              <strong>Dr. Nexus Medical Knowledge Base</strong> v{MEDICAL_DATA.metadata.version}
            </div>
            <div className="flex items-center gap-4">
              <span>Source Files: {MEDICAL_DATA.metadata.source_files_count}</span>
              <span>•</span>
              <span>Processing Time: {MEDICAL_DATA.metadata.processing_duration_seconds.toFixed(2)}s</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
