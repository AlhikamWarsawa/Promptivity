'use client';

import { FrameworkPageLayout } from '@/components/frameworks/FrameworkPageLayout';
import { PomodoroView }        from '@/components/frameworks/pomodoro/PomodoroView';

export default function PomodoroPage() {
  return (
    <FrameworkPageLayout frameworkId="pomodoro">
      <PomodoroView />
    </FrameworkPageLayout>
  );
}
