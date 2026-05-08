'use client';

import { FrameworkPageLayout } from '@/components/frameworks/FrameworkPageLayout';
import { SMARTGoalsView }      from '@/components/frameworks/smart-goals/SMARTGoalsView';

export default function SMARTGoalsPage() {
  return (
    <FrameworkPageLayout frameworkId="smart-goals">
      <SMARTGoalsView />
    </FrameworkPageLayout>
  );
}
