'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Folder,
  Calendar,
  ExternalLink,
  ChevronRight,
  Download,
  Eye,
  Info,
  Stethoscope,
  FlaskConical,
  ClipboardList,
  Database,
  Code,
  FileJson,
  FileCode,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { MEDICAL_DOCUMENTS, DOCUMENT_TYPE_INFO, CATEGORY_INFO, type MedicalDocument } from '@/lib/documents';
import { cn } from '@/lib/utils';

const TYPE_COLORS: Record<string, string> = {
  CCD: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  CCDA: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  FHIR: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  PDF: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  XML: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  JSON: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  clinical: <Stethoscope className="w-5 h-5" />,
  lab: <FlaskConical className="w-5 h-5" />,
  imaging: <Eye className="w-5 h-5" />,
  administrative: <FileText className="w-5 h-5" />,
  summary: <ClipboardList className="w-5 h-5" />
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  CCD: <FileCode className="w-5 h-5" />,
  CCDA: <FileCode className="w-5 h-5" />,
  FHIR: <Database className="w-5 h-5" />,
  PDF: <FileText className="w-5 h-5" />,
  XML: <Code className="w-5 h-5" />,
  JSON: <FileJson className="w-5 h-5" />
};

export default function DocumentsPage() {
  const [selectedDoc, setSelectedDoc] = useState<MedicalDocument | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'by-type' | 'by-category'>('all');

  // Group documents by type
  const documentsByType = MEDICAL_DOCUMENTS.reduce((acc, doc) => {
    if (!acc[doc.type]) acc[doc.type] = [];
    acc[doc.type].push(doc);
    return acc;
  }, {} as Record<string, MedicalDocument[]>);

  // Group documents by category
  const documentsByCategory = MEDICAL_DOCUMENTS.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, MedicalDocument[]>);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="w-8 h-8 text-indigo-600" />
          Medical Documents
        </h1>
        <p className="text-muted-foreground mt-1">
          Source files and clinical documents that make up your health record
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-3xl font-bold">{MEDICAL_DOCUMENTS.length}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full dark:bg-indigo-900">
                <Folder className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">FHIR Resources</p>
                <p className="text-3xl font-bold text-green-600">
                  {documentsByType['FHIR']?.length || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full dark:bg-green-900">
                <Database className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">C-CDA Documents</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {documentsByType['CCDA']?.length || 0}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full dark:bg-indigo-900">
                <FileCode className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Data Sources</p>
                <p className="text-3xl font-bold text-purple-600">3</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full dark:bg-purple-900">
                <ExternalLink className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Tabs defaultValue="all" onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList>
                  <TabsTrigger value="all">All Documents</TabsTrigger>
                  <TabsTrigger value="by-type">By Type</TabsTrigger>
                  <TabsTrigger value="by-category">By Category</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {activeTab === 'all' && (
                <div className="space-y-3">
                  {MEDICAL_DOCUMENTS.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      isSelected={selectedDoc?.id === doc.id}
                      onClick={() => setSelectedDoc(doc)}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'by-type' && (
                <div className="space-y-6">
                  {Object.entries(documentsByType).map(([type, docs]) => (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-3">
                        {TYPE_ICONS[type]}
                        <h3 className="font-semibold">
                          {DOCUMENT_TYPE_INFO[type as keyof typeof DOCUMENT_TYPE_INFO]?.name || type}
                        </h3>
                        <Badge variant="secondary">{docs.length}</Badge>
                      </div>
                      <div className="space-y-2 pl-7">
                        {docs.map((doc) => (
                          <DocumentCard
                            key={doc.id}
                            document={doc}
                            isSelected={selectedDoc?.id === doc.id}
                            onClick={() => setSelectedDoc(doc)}
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'by-category' && (
                <div className="space-y-6">
                  {Object.entries(documentsByCategory).map(([category, docs]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        {CATEGORY_ICONS[category]}
                        <h3 className="font-semibold">
                          {CATEGORY_INFO[category as keyof typeof CATEGORY_INFO]?.name || category}
                        </h3>
                        <Badge variant="secondary">{docs.length}</Badge>
                      </div>
                      <div className="space-y-2 pl-7">
                        {docs.map((doc) => (
                          <DocumentCard
                            key={doc.id}
                            document={doc}
                            isSelected={selectedDoc?.id === doc.id}
                            onClick={() => setSelectedDoc(doc)}
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Document Details Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Document Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDoc ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedDoc.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={TYPE_COLORS[selectedDoc.type]}>
                        {selectedDoc.type}
                      </Badge>
                      <Badge variant="outline">
                        {CATEGORY_INFO[selectedDoc.category]?.name || selectedDoc.category}
                      </Badge>
                    </div>
                  </div>

                  {selectedDoc.description && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                      <p className="text-sm">{selectedDoc.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-1">Source</h4>
                      <p>{selectedDoc.source}</p>
                    </div>
                    {selectedDoc.date && (
                      <div>
                        <h4 className="font-medium text-muted-foreground mb-1">Date</h4>
                        <p>{new Date(selectedDoc.date).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {selectedDoc.provider && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Provider</h4>
                      <p className="text-sm">{selectedDoc.provider}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">File Path</h4>
                    <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                      {selectedDoc.path}
                    </code>
                  </div>

                  {selectedDoc.sections && selectedDoc.sections.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Sections</h4>
                      <div className="space-y-1">
                        {selectedDoc.sections.map((section, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>{section}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a document to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Data Standards Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Database className="w-5 h-5" />
            Healthcare Data Standards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold">FHIR R4</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Fast Healthcare Interoperability Resources - The modern standard for healthcare data exchange,
                enabling seamless integration between systems.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h4 className="font-semibold">C-CDA</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Consolidated Clinical Document Architecture - HL7 standard for clinical documents,
                used for patient summaries and care transitions.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold">LOINC & SNOMED-CT</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Clinical terminology standards for lab tests (LOINC) and medical concepts (SNOMED-CT),
                ensuring consistent data across providers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface DocumentCardProps {
  document: MedicalDocument;
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}

function DocumentCard({ document, isSelected, onClick, compact = false }: DocumentCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all',
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border hover:border-primary/50 hover:bg-muted/50',
        compact && 'p-2'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          TYPE_COLORS[document.type]?.split(' ')[0] || 'bg-gray-100'
        )}>
          {TYPE_ICONS[document.type] || <FileText className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('font-medium truncate', compact && 'text-sm')}>
              {document.name}
            </span>
            {!compact && (
              <Badge className={cn('shrink-0 text-xs', TYPE_COLORS[document.type])}>
                {document.type}
              </Badge>
            )}
          </div>
          {!compact && (
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{document.source}</span>
              {document.date && (
                <>
                  <span>-</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(document.date).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <ChevronRight className={cn(
          'w-4 h-4 text-muted-foreground transition-transform',
          isSelected && 'rotate-90'
        )} />
      </div>
    </button>
  );
}
