'use client';

import { useMemo }              from 'react';
import { motion }               from 'framer-motion';
import { TimeBlock }            from './TimeBlock';
import { FrameworkEmptyState }  from '@/components/frameworks/FrameworkPageLayout';
import { getFramework }         from '@/lib/frameworkConfig';
import { useFramework }         from '@/store/usePTStore';
import PTStorage                from '@/lib/storage';

/* ============================================
   TimeBlockingView — Daily schedule timeline
   
   Layout:
   - Jam axis di kiri (6:00 – 22:00)
   - Blok waktu di kanan, posisi & height proporsional
   - Gap antar block = waktu kosong/bebas
   ============================================ */

interface ScheduleSlot {
  time:     string;
  task:     string;
  duration: number;
  category: string;
  priority?: string;
}

const PX_PER_MINUTE  = 1.4;  // Pixels per minute — adjust untuk density

export function TimeBlockingView() {
  const fwData = useFramework('time-blocking');
  const meta   = getFramework('time-blocking');
  const persona = PTStorage.getPersona();
  const energy = persona?.energyPattern ?? 'mixed';

  const { startHour, endHour } = useMemo(() => {
    if (energy === 'morning') return { startHour: 7, endHour: 21 };
    if (energy === 'night') return { startHour: 13, endHour: 23 };
    return { startHour: 6, endHour: 22 };
  }, [energy]);

  const totalMinutes = (endHour - startHour) * 60;

  const schedule = useMemo((): ScheduleSlot[] => {
    if (!fwData?.rawData) return [];
    const raw = fwData.rawData as { schedule?: ScheduleSlot[] };
    return raw.schedule ?? [];
  }, [fwData]);

  if (!fwData || schedule.length === 0) {
    return <FrameworkEmptyState frameworkId="time-blocking" message="Tidak ada jadwal yang berhasil diekstrak. Coba ceritakan lebih banyak tentang rutinitas harian, jam kerja, dan kapan kamu paling produktif." />;
  }

  function localTimeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h - startHour) * 60 + (m || 0);
  }

  // Sort by time
  const sortedSchedule = [...schedule].sort((a, b) => {
    const [ah, am] = a.time.split(':').map(Number);
    const [bh, bm] = b.time.split(':').map(Number);
    return (ah * 60 + am) - (bh * 60 + bm);
  });

  const totalHeight = totalMinutes * PX_PER_MINUTE;

  // Hour markers for the axis
  const hourMarkers = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => ({
      hour:      startHour + i,
      yPosition: i * 60 * PX_PER_MINUTE,
    }),
  );

  // Category legend
  const usedCategories = [...new Set(sortedSchedule.map((s) => s.category))];

  return (
    <div>
      {/* Info bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-5 p-3 rounded-sketch border-2 border-pt-black text-sm flex items-center justify-between gap-4"
        style={{ backgroundColor: '#E9B12A' + '20', fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
      >
        <span>
          📅 Jadwal di bawah adalah <strong>rekomendasi Moti</strong> berdasarkan ceritamu.
        </span>
        <div className="shrink-0 px-2 py-1 rounded-full bg-pt-green/20 border border-pt-green/30 text-[10px] font-bold text-pt-green uppercase tracking-wider">
          ⚡ Optimized for {energy} energy
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 mb-5"
      >
        {[
          { key: 'work',     label: 'Kerja',   color: '#35D5F4' },
          { key: 'personal', label: 'Personal', color: '#9AD84B' },
          { key: 'health',   label: 'Kesehatan',color: '#17B66A' },
          { key: 'learning', label: 'Belajar',  color: '#2196E8' },
          { key: 'other',    label: 'Lainnya',  color: '#E9B12A' },
        ].filter((c) => usedCategories.includes(c.key)).map((cat) => (
          <div key={cat.key} className="flex items-center gap-1.5">
            <div
              className="w-3 h-5 rounded-sm border border-pt-black"
              style={{ backgroundColor: cat.color + '40', borderLeftColor: cat.color, borderLeftWidth: '3px' }}
            />
            <span className="text-xs" style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}>
              {cat.label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Timeline container */}
      <div
        className="relative flex gap-4 overflow-x-auto pb-4"
        style={{ minWidth: '320px' }}
      >
        {/* Hour axis — LEFT */}
        <div
          className="relative shrink-0"
          style={{ width: '48px', height: `${totalHeight}px` }}
          aria-hidden="true"
        >
          {hourMarkers.map(({ hour, yPosition }) => (
            <div
              key={hour}
              className="absolute left-0 right-0 flex items-center"
              style={{ top: yPosition }}
            >
              <span
                className="text-[10px] font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
              >
                {String(hour).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>

        {/* Grid lines + blocks — RIGHT */}
        <div
          className="relative flex-1 border-l-2 border-pt-black/20"
          style={{ height: `${totalHeight}px`, minWidth: '240px' }}
        >
          {/* Hour grid lines */}
          {hourMarkers.map(({ hour, yPosition }) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-pt-black/10"
              style={{ top: yPosition }}
              aria-hidden="true"
            />
          ))}

          {/* Current time indicator */}
          <CurrentTimeIndicator startHour={startHour} totalMinutes={totalMinutes} />

          {/* Time blocks */}
          {sortedSchedule.map((slot, i) => {
            const topOffset = localTimeToMinutes(slot.time) * PX_PER_MINUTE;

            return (
              <div
                key={i}
                className="absolute left-2 right-0"
                style={{ top: `${topOffset}px` }}
              >
                <TimeBlock
                  time={slot.time}
                  task={slot.task}
                  duration={slot.duration}
                  category={slot.category}
                  priority={slot.priority}
                  pixelsPerMinute={PX_PER_MINUTE}
                  index={i}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 grid grid-cols-3 gap-3"
      >
        <StatCard
          label="Total Task"
          value={sortedSchedule.length.toString()}
          color="var(--pt-blue)"
        />
        <StatCard
          label="Total Waktu"
          value={`${Math.round(sortedSchedule.reduce((sum, s) => sum + s.duration, 0) / 60)}j`}
          color="var(--pt-mustard)"
        />
        <StatCard
          label="Jam Dimulai"
          value={sortedSchedule[0]?.time ?? '-'}
          color="var(--pt-green)"
        />
      </motion.div>
    </div>
  );
}

/* ---- Current Time Indicator ---- */
function CurrentTimeIndicator({ startHour, totalMinutes }: { startHour: number; totalMinutes: number }) {
  const now = new Date();
  const minutesSinceDayStart =
    (now.getHours() - startHour) * 60 + now.getMinutes();

  if (minutesSinceDayStart < 0 || minutesSinceDayStart > totalMinutes) return null;
  const top = minutesSinceDayStart * PX_PER_MINUTE;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="absolute left-0 right-0 z-10 flex items-center gap-1.5"
      style={{ top }}
      aria-label="Waktu sekarang"
    >
      <div
        className="w-3 h-3 rounded-full border-2 border-white shrink-0"
        style={{ backgroundColor: 'var(--pt-coral)' }}
      />
      <div
        className="flex-1 h-0.5"
        style={{ backgroundColor: 'var(--pt-coral)' }}
      />
    </motion.div>
  );
}

/* ---- Stat Card ---- */
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-sketch border-2 border-pt-black p-3 text-center"
      style={{ backgroundColor: 'var(--pt-white)' }}
    >
      <p
        className="text-h3"
        style={{ fontFamily: 'var(--font-display)', color }}
      >
        {value}
      </p>
      <p
        className="text-label"
        style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
      >
        {label}
      </p>
    </div>
  );
}
