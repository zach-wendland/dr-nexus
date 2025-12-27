'use client';

import React from 'react';
import { ActionItemsPanel } from '@/components/visualizations/ActionItemsPanel';
import { useMedicalStore } from '@/lib/store';
import { ListTodo } from 'lucide-react';

export default function ActionsPage() {
  const { actionItems, unresolvedQuestions } = useMedicalStore();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ListTodo className="w-8 h-8 text-red-600" />
          Action Items & Questions
        </h1>
        <p className="text-muted-foreground mt-1">
          Track follow-up actions and unresolved medical questions
        </p>
      </div>

      <ActionItemsPanel
        actionItems={actionItems}
        unresolvedQuestions={unresolvedQuestions}
      />
    </div>
  );
}
