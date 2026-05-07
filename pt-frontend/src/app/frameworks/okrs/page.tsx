'use client';

import { FrameworkPageLayout } from '@/components/frameworks/FrameworkPageLayout';
import { OKRView }             from '@/components/frameworks/okrs/OKRView';

export default function OKRsPage() {
  return (
    <FrameworkPageLayout frameworkId="okrs">
      <OKRView />
    </FrameworkPageLayout>
  );
}
