'use client';

import { FrameworkPageLayout } from '@/components/frameworks/FrameworkPageLayout';
import { WeeklyReviewView }    from '@/components/frameworks/weekly-review/WeeklyReviewView';

export default function WeeklyReviewPage() {
  return (
    <FrameworkPageLayout frameworkId="weekly-review">
      <WeeklyReviewView />
    </FrameworkPageLayout>
  );
}
