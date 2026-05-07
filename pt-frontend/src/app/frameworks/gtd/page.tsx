'use client';

import { FrameworkPageLayout } from '@/components/frameworks/FrameworkPageLayout';
import { GTDView }             from '@/components/frameworks/gtd/GTDView';

export default function GTDPage() {
  return (
    <FrameworkPageLayout frameworkId="gtd">
      <GTDView />
    </FrameworkPageLayout>
  );
}
