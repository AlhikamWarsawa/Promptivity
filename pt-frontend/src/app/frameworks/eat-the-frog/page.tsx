'use client';

import { FrameworkPageLayout } from '@/components/frameworks/FrameworkPageLayout';
import { EatTheFrogView }      from '@/components/frameworks/eat-the-frog/EatTheFrogView';

export default function EatTheFrogPage() {
  return (
    <FrameworkPageLayout frameworkId="eat-the-frog">
      <EatTheFrogView />
    </FrameworkPageLayout>
  );
}
