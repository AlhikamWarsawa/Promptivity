'use client';

import { FrameworkPageLayout } from '@/components/frameworks/FrameworkPageLayout';
import { PARAView }            from '@/components/frameworks/para/PARAView';

export default function PARAPage() {
  return (
    <FrameworkPageLayout frameworkId="para">
      <PARAView />
    </FrameworkPageLayout>
  );
}
