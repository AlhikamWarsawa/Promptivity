'use client';

import { FrameworkPageLayout } from '@/components/frameworks/FrameworkPageLayout';
import { KanbanView }          from '@/components/frameworks/kanban/KanbanView';

export default function KanbanPage() {
  return (
    <FrameworkPageLayout frameworkId="kanban">
      <KanbanView />
    </FrameworkPageLayout>
  );
}
