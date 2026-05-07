'use client';

import { FrameworkPageLayout } from '@/components/frameworks/FrameworkPageLayout';
import { EisenhowerView }      from '@/components/frameworks/eisenhower/EisenhowerView';

export default function EisenhowerPage() {
  return (
    <FrameworkPageLayout frameworkId="eisenhower">
      <EisenhowerView />
    </FrameworkPageLayout>
  );
}
