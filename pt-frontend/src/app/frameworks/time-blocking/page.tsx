'use client';

import { FrameworkPageLayout }     from '@/components/frameworks/FrameworkPageLayout';
import { TimeBlockingView }        from '@/components/frameworks/time-blocking/TimeBlockingView';

export default function TimeBlockingPage() {
  return (
    <FrameworkPageLayout frameworkId="time-blocking">
      <TimeBlockingView />
    </FrameworkPageLayout>
  );
}
