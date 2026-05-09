'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FrameworkEmptyState } from '@/components/frameworks/FrameworkPageLayout';
import { getFramework } from '@/lib/frameworkConfig';
import { useFramework } from '@/store/usePTStore';
import { ParetoData } from '@/types/pt.types';

export function ParetoView() {
  const fwData = useFramework('pareto');
  const meta = getFramework('pareto');

  const rawData = useMemo(() => {
    if (!fwData?.rawData) return null;
    return fwData.rawData as ParetoData;
  }, [fwData]);

  if (!fwData || !rawData) {
    return <FrameworkEmptyState frameworkId="pareto" />;
  }

  const accentColor = meta?.accentColor ?? 'var(--pt-blue)';

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div
        variants={itemVariants}
        className="p-4 rounded-sketch border-2 border-pt-black"
        style={{ backgroundColor: accentColor + '12' }}
      >
        <p className="text-sm leading-relaxed text-pt-brown">
          <strong>The Pareto Principle (80/20)</strong> suggests that 80% of your results come from 20% of your efforts. Focus heavily on high-impact tasks and eliminate or delegate the rest.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Impact 20% */}
        <motion.div variants={itemVariants} className="p-5 rounded-sketch border-2 border-pt-black bg-pt-white shadow-sketch">
          <h3 className="font-display text-h4 mb-3 flex items-center gap-2" style={{ color: accentColor }}>
            <span>🔥</span> High Impact (The 20%)
          </h3>
          <ul className="space-y-3">
            {(rawData.highImpact ?? []).length === 0 ? (
              <li className="text-sm text-pt-brown">No high-impact tasks identified.</li>
            ) : (
              rawData.highImpact.map((item, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-sketch border border-pt-black/20 bg-pt-cream">
                  <span className="text-xl">⭐</span>
                  <span className="text-pt-black font-bold">{item}</span>
                </li>
              ))
            )}
          </ul>
        </motion.div>

        {/* Maintenance Tasks */}
        <motion.div variants={itemVariants} className="p-5 rounded-sketch border-2 border-pt-black bg-pt-white">
          <h3 className="font-display text-h4 mb-3 flex items-center gap-2">
            <span>⚙️</span> Maintenance (The 80%)
          </h3>
          <ul className="space-y-2">
            {(rawData.maintenance ?? []).length === 0 ? (
              <li className="text-sm text-pt-brown">No maintenance tasks listed.</li>
            ) : (
              rawData.maintenance.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-pt-brown">
                  <span className="mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))
            )}
          </ul>
        </motion.div>

        {/* Leverage Opportunities */}
        <motion.div variants={itemVariants} className="p-5 rounded-sketch border-2 border-pt-black bg-[#E0F8EE]">
          <h3 className="font-display text-h4 mb-3 flex items-center gap-2">
            <span>📈</span> Leverage Opportunities
          </h3>
          <ul className="space-y-2">
            {(rawData.leverage ?? []).length === 0 ? (
              <li className="text-sm text-pt-brown">No leverage opportunities identified.</li>
            ) : (
              rawData.leverage.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#059669] font-bold">
                  <span className="mt-0.5">↳</span>
                  <span>{item}</span>
                </li>
              ))
            )}
          </ul>
        </motion.div>

        {/* Eliminate / Reduce */}
        <motion.div variants={itemVariants} className="p-5 rounded-sketch border-2 border-pt-black bg-[#FEE8EA]">
          <h3 className="font-display text-h4 mb-3 flex items-center gap-2">
            <span>🗑️</span> Eliminate or Reduce
          </h3>
          <ul className="space-y-2">
            {(rawData.eliminate ?? []).length === 0 ? (
              <li className="text-sm text-pt-brown">Nothing to eliminate listed.</li>
            ) : (
              rawData.eliminate.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#D32F2F]">
                  <span className="mt-0.5">✕</span>
                  <span className="line-through opacity-80">{item}</span>
                </li>
              ))
            )}
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
}
