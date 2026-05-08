'use client';

import { useState }                from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PARAItem, PARAItemType }  from './PARAItem';
import { cn }                      from '@/lib/utils';

/* ============================================
   PARASection — One of the 4 PARA buckets.
   
   Each section has:
   - Colored folder-tab header
   - Item count
   - Expandable item list
   - Section description / purpose note
   ============================================ */

interface PARAItemData {
  name:        string;
  description: string;
  tasks?:      Array<{ title: string; isCompleted?: boolean }>;
}

interface SectionConfig {
  id:          PARAItemType;
  title:       string;
  subtitle:    string;
  icon:        string;
  accentColor: string;
  bgColor:     string;
  tabColor:    string;
  purpose:     string;
  emptyText:   string;
}

export const PARA_SECTION_CONFIG: Record<PARAItemType, SectionConfig> = {
  project: {
    id:          'project',
    title:       'Projects',
    subtitle:    'Aktif · Punya deadline',
    icon:        '📁',
    accentColor: 'var(--pt-blue)',
    bgColor:     '#E8F4FD',
    tabColor:    'var(--pt-blue)',
    purpose:     'Hal yang sedang kamu kerjakan dengan tujuan dan deadline spesifik.',
    emptyText:   'Tidak ada project aktif yang terdeteksi.',
  },
  area: {
    id:          'area',
    title:       'Areas',
    subtitle:    'Ongoing · Tanpa deadline',
    icon:        '🗂️',
    accentColor: 'var(--pt-green)',
    bgColor:     '#E0F8EE',
    tabColor:    'var(--pt-green)',
    purpose:     'Tanggung jawab berkelanjutan yang harus dijaga kualitasnya.',
    emptyText:   'Tidak ada area tanggung jawab yang terdeteksi.',
  },
  resource: {
    id:          'resource',
    title:       'Resources',
    subtitle:    'Referensi · Untuk nanti',
    icon:        '📎',
    accentColor: 'var(--pt-mustard)',
    bgColor:     '#FDF5E0',
    tabColor:    'var(--pt-mustard)',
    purpose:     'Informasi, referensi, dan materi yang mungkin berguna di masa depan.',
    emptyText:   'Tidak ada resource yang teridentifikasi.',
  },
  archive: {
    id:          'archive',
    title:       'Archives',
    subtitle:    'Selesai · Tidak aktif',
    icon:        '📦',
    accentColor: '#9B9B9B',
    bgColor:     '#F3F3F1',
    tabColor:    '#9B9B9B',
    purpose:     'Project dan area yang sudah selesai atau tidak lagi aktif.',
    emptyText:   'Tidak ada arsip yang terdeteksi. Bagus — semua masih aktif!',
  },
};

interface PARASection_Props {
  sectionId:    PARAItemType;
  items:        PARAItemData[];
  defaultOpen?: boolean;
  animDelay?:   number;
}

export function PARASection({
  sectionId, items, defaultOpen = true, animDelay = 0,
}: PARASection_Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const config              = PARA_SECTION_CONFIG[sectionId];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animDelay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-sketch border-2 border-pt-black overflow-hidden"
      style={{ boxShadow: '4px 4px 0px #2B2B2B' }}
    >
      {/* Folder tab header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer"
        style={{
          backgroundColor: config.bgColor,
          borderBottom:    isOpen ? '2px solid var(--pt-black)' : 'none',
        }}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {/* Folder icon — animated */}
          <motion.span
            animate={isOpen ? { rotate: 8, scale: 1.15 } : { rotate: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="text-3xl"
            aria-hidden="true"
          >
            {isOpen ? '📂' : config.icon}
          </motion.span>

          <div className="text-left">
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize:   'var(--text-h3)',
                color:      'var(--pt-black)',
              }}
            >
              {config.title}
            </h3>
            <p
              className="text-[11px] font-bold"
              style={{ fontFamily: 'var(--font-body)', color: config.accentColor }}
            >
              {config.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Count badge */}
          <span
            className="px-3 py-1 rounded-sketch border-2 border-pt-black text-label font-bold"
            style={{
              fontFamily:      'var(--font-body)',
              backgroundColor: items.length > 0 ? config.tabColor : 'var(--pt-cream)',
              color:           items.length > 0 ? 'white'          : '#9B9B9B',
            }}
          >
            {items.length}
          </span>

          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-lg"
            style={{ color: '#9B9B9B' }}
            aria-hidden="true"
          >
            ▾
          </motion.span>
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {/* Purpose note */}
            <div
              className="px-5 py-2.5 border-b border-pt-black/10"
              style={{ backgroundColor: config.bgColor + '80' }}
            >
              <p
                className="text-xs italic"
                style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
              >
                {config.purpose}
              </p>
            </div>

            {/* Items list */}
            <div className="p-4 space-y-2 bg-pt-white">
              {items.length === 0 ? (
                <p
                  className="text-sm text-center py-4"
                  style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
                >
                  {config.emptyText}
                </p>
              ) : (
                items.map((item, i) => (
                  <PARAItem
                    key={i}
                    name={item.name}
                    description={item.description}
                    type={sectionId}
                    tasks={item.tasks ?? []}
                    index={i}
                    accentColor={config.accentColor}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
