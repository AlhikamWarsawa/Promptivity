'use client';

import { FrameworkPageLayout } from '@/components/frameworks/FrameworkPageLayout';
import { CommitmentView }      from '@/components/frameworks/commitment-inventory/CommitmentView';

export default function CommitmentInventoryPage() {
  return (
    <FrameworkPageLayout frameworkId="commitment-inventory">
      <CommitmentView />
    </FrameworkPageLayout>
  );
}
