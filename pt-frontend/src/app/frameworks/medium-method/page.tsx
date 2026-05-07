'use client';

import { FrameworkPageLayout } from '@/components/frameworks/FrameworkPageLayout';
import { MediumMethodView }    from '@/components/frameworks/medium-method/MediumMethodView';

export default function MediumMethodPage() {
  return (
    <FrameworkPageLayout frameworkId="medium-method">
      <MediumMethodView />
    </FrameworkPageLayout>
  );
}
