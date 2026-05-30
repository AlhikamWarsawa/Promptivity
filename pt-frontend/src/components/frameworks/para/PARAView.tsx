'use client';

import { useMemo }              from 'react';
import { motion }               from 'framer-motion';
import { PARASection }          from './PARASection';
import { FrameworkEmptyState }  from '@/components/frameworks/FrameworkPageLayout';
import { HandDrawnDivider }     from '@/components/pt/HandDrawnDivider';
import { useFramework }         from '@/store/usePTStore';
import type { Task }            from '@/types/pt.types';

/* ============================================
   PARAView — PARA Method framework page.
   
   PARA = Projects / Areas / Resources / Archives
   
   Layout:
   1. Philosophy note + visual legend
   2. Projects section (open by default)
   3. Areas section (open by default)
   4. Resources section (closed by default)
   5. Archives section (closed by default)
   6. PARA tip footer
   ============================================ */

interface PARAItemRaw {
  id?:          string;
  name:        string;
  description: string;
  tasks?:      Task[];
  isCompleted?: boolean;
  completed?:  boolean;
}

interface PARAData {
  projects?:  PARAItemRaw[];
  areas?:     PARAItemRaw[];
  resources?: PARAItemRaw[];
  archives?:  PARAItemRaw[];
}

export function PARAView() {
  const fwData = useFramework('para');

  const data = useMemo((): PARAData => {
    if (!fwData?.rawData) return {};
    return fwData.rawData as PARAData;
  }, [fwData]);

  const totalItems =
    (data.projects?.length  ?? 0) +
    (data.areas?.length     ?? 0) +
    (data.resources?.length ?? 0) +
    (data.archives?.length  ?? 0);

  if (!fwData || totalItems === 0) {
    return <FrameworkEmptyState frameworkId="para" />;
  }

  return (
    <div className="space-y-6">

      {/* Philosophy note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 rounded-sketch border-2 border-pt-black"
        style={{ backgroundColor: 'var(--pt-lime)' + '20' }}
      >
        <p
          className="text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
        >
          🗂️ <strong>PARA Method</strong> mengorganisir seluruh informasi dan komitmenmu
          ke dalam 4 kategori: hal yang sedang dikerjakan (<em>Projects</em>), hal yang
          terus dijaga (<em>Areas</em>), referensi berguna (<em>Resources</em>), dan
          yang sudah selesai (<em>Archives</em>).
        </p>
      </motion.div>

      {/* Visual legend — 4 folder tabs */}
      <PARALegend data={data} />

      {/* 4 PARA sections */}
      <div className="space-y-5">

        {/* Projects — always open by default */}
        <PARASection
          sectionId="project"
          items={data.projects ?? []}
          defaultOpen={true}
          animDelay={0.05}
        />

        {/* Areas */}
        <PARASection
          sectionId="area"
          items={data.areas ?? []}
          defaultOpen={true}
          animDelay={0.12}
        />

        <HandDrawnDivider
          variant="dots"
          color="var(--pt-black)"
          className="opacity-20"
        />

        {/* Resources — closed by default */}
        <PARASection
          sectionId="resource"
          items={data.resources ?? []}
          defaultOpen={false}
          animDelay={0.18}
        />

        {/* Archives — closed by default */}
        <PARASection
          sectionId="archive"
          items={data.archives ?? []}
          defaultOpen={false}
          animDelay={0.24}
        />
      </div>

      {/* PARA tip footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-sketch border-2 border-pt-black"
        style={{ backgroundColor: 'var(--pt-cream)' }}
      >
        <p
          className="text-label font-bold mb-2 uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
        >
          💡 Tips PARA
        </p>
        <ul className="space-y-1.5">
          {[
            'Setiap Project harus punya tujuan akhir yang jelas dan deadline.',
            'Area adalah tanggung jawab yang tidak pernah benar-benar "selesai".',
            'Kalau sebuah Project selesai, pindahkan ke Archive — bukan hapus.',
            'Review PARA setiap minggu bersamaan dengan Weekly Review.',
          ].map((tip, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm"
              style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
            >
              <span
                className="shrink-0 font-bold mt-0.5"
                style={{ color: 'var(--pt-green)' }}
              >
                →
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

/* ---- PARA Legend ---- */
function PARALegend({ data }: { data: PARAData }) {
  const sections = [
    { label: 'Projects',  count: data.projects?.length  ?? 0, color: 'var(--pt-blue)',    icon: '📁' },
    { label: 'Areas',     count: data.areas?.length     ?? 0, color: 'var(--pt-green)',   icon: '🗂️' },
    { label: 'Resources', count: data.resources?.length ?? 0, color: 'var(--pt-mustard)', icon: '📎' },
    { label: 'Archives',  count: data.archives?.length  ?? 0, color: '#9B9B9B',           icon: '📦' },
  ];

  const total = sections.reduce((s, i) => s + i.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="rounded-sketch border-2 border-pt-black overflow-hidden"
      style={{ boxShadow: '3px 3px 0px #2B2B2B' }}
    >
      {/* Stacked bar */}
      <div className="flex h-4 overflow-hidden">
        {sections.map((s) => {
          const pct = total > 0 ? (s.count / total) * 100 : 25;
          return (
            <motion.div
              key={s.label}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ backgroundColor: s.color }}
              title={`${s.label}: ${s.count}`}
            />
          );
        })}
      </div>

      {/* Labels */}
      <div className="grid grid-cols-4 divide-x-2 divide-pt-black bg-pt-white">
        {sections.map((s) => (
          <div key={s.label} className="p-3 text-center">
            <p className="text-xl mb-0.5" aria-hidden="true">{s.icon}</p>
            <p
              className="text-h4"
              style={{ fontFamily: 'var(--font-display)', color: s.color }}
            >
              {s.count}
            </p>
            <p
              className="text-[10px] font-bold"
              style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
