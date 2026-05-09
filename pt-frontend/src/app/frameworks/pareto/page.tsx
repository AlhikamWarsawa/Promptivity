import { FrameworkPageLayout } from '@/components/frameworks/FrameworkPageLayout';
import { ParetoView } from '@/components/frameworks/pareto/ParetoView';

export default function ParetoPage() {
  return (
    <FrameworkPageLayout frameworkId="pareto">
      <ParetoView />
    </FrameworkPageLayout>
  );
}
