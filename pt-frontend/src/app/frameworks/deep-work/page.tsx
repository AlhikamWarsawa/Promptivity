import { FrameworkPageLayout } from '@/components/frameworks/FrameworkPageLayout';
import { DeepWorkView } from '@/components/frameworks/deep-work/DeepWorkView';

export default function DeepWorkPage() {
  return (
    <FrameworkPageLayout frameworkId="deep-work">
      <DeepWorkView />
    </FrameworkPageLayout>
  );
}
