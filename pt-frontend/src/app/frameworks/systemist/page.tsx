'use client';

import { FrameworkPageLayout } from '@/components/frameworks/FrameworkPageLayout';
import { SystemistView }       from '@/components/frameworks/systemist/SystemistView';

export default function SystemistPage() {
  return (
    <FrameworkPageLayout frameworkId="systemist">
      <SystemistView />
    </FrameworkPageLayout>
  );
}
