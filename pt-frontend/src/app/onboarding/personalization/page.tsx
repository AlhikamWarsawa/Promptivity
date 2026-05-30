'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PTButton } from '@/components/pt/PTButton';
import { PTCard } from '@/components/pt/PTCard';
import { PTSelect } from '@/components/pt/PTSelect';
import { PTTextarea } from '@/components/pt/PTTextarea';
import { HandDrawnDivider } from '@/components/pt/HandDrawnDivider';
import { OnboardingTopBar } from '@/components/pt/OnboardingTopBar';
import PTStorage from '@/lib/storage';
import type { Personalization, UserRole, EnergyPattern, PreferredStyle } from '@/types/pt.types';

/* ============================================
   /onboarding/personalization — Form personalisasi
   
   Fields:
   1. Nama (text input)
   2. Role (select)
   3. Goal besar (textarea, max 100 kata)
   4. Problem utama (textarea, max 100 kata)
   5. Pola energi (3 option pills)
   6. Preferensi style (2 option pills)
   
   Submit → savePersona → /onboarding/brain-dump
   ============================================ */

// ---- Form State ----

interface FormState {
  name:           string;
  role:           UserRole;
  bigGoal:        string;
  currentProblem: string;
  energyPattern:  EnergyPattern;
  preferredStyle: PreferredStyle;
}

const INITIAL_STATE: FormState = {
  name:           '',
  role:           'mahasiswa',
  bigGoal:        '',
  currentProblem: '',
  energyPattern:  'variable',
  preferredStyle: 'flexible',
};

// ---- Main Component ----

export default function PersonalizationPage() {
  const router  = useRouter();
  const [form, setForm]       = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors]   = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load existing data on mount
  useEffect(() => {
    const existing = PTStorage.getPersona();
    if (existing) {
      setForm({
        name:           existing.name ?? '',
        role:           existing.role ?? 'mahasiswa',
        bigGoal:        existing.bigGoal ?? '',
        currentProblem: existing.currentProblem ?? '',
        energyPattern:  existing.energyPattern ?? 'variable',
        preferredStyle: existing.preferredStyle ?? 'flexible',
      });
    }
  }, []);

  // Generic field update
  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear error saat user mulai ngetik
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors],
  );

  // Validate
  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!form.name.trim()) {
      newErrors.name = 'Nama tidak boleh kosong.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Submit
  async function handleSubmit() {
    if (!validate()) return;

    setIsSaving(true);

    const persona: Personalization = {
      name:           form.name.trim(),
      role:           form.role,
      bigGoal:        form.bigGoal.trim(),
      currentProblem: form.currentProblem.trim(),
      energyPattern:  form.energyPattern,
      preferredStyle: form.preferredStyle,
    };

    PTStorage.savePersona(persona);

    // Sedikit delay agar user lihat loading state
    await new Promise((r) => setTimeout(r, 500));

    router.push('/onboarding/input-method');
  }

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden:  { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--pt-white)' }}
    >
      <OnboardingTopBar currentStep={2} />

      {/* Form content */}
      <div className="flex-1 px-6 py-10">
        <div className="max-w-xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-8"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="text-center">
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                  color: 'var(--pt-black)',
                  lineHeight: 1.15,
                }}
              >
                Kenalin diri kamu ✏️
              </h1>
              <p
                className="mt-2 text-sm"
                style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
              >
                Semua opsional kecuali nama. Makin detail, makin personal missionnya.
              </p>
            </motion.div>

            {/* ---- SECTION 1: Identitas ---- */}
            <motion.div variants={itemVariants}>
              <PTCard variant="white" padding="lg" accentColor="var(--pt-blue)" accentHeight={4}>
                <SectionLabel icon="👤" label="Identitas" />

                {/* Nama */}
                <div className="mt-4">
                  <label
                    htmlFor="pt-name"
                    className="flex items-center gap-1.5 mb-1.5"
                  >
                    <span
                      className="text-label font-bold uppercase tracking-wide"
                      style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
                    >
                      Nama <span style={{ color: 'var(--pt-coral)' }}>*</span>
                    </span>
                  </label>
                  <input
                    id="pt-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Panggil aku..."
                    autoComplete="given-name"
                    className={[
                      'w-full px-4 py-3',
                      'font-body text-body',
                      'rounded-sketch border-2 border-pt-black',
                      'bg-pt-white text-pt-black',
                      'shadow-sketch',
                      'transition-all duration-150',
                      'placeholder:text-[#6B6B6B] placeholder:opacity-60',
                      'focus:outline-none focus:ring-2 focus:ring-pt-blue focus:ring-offset-1',
                      errors.name ? 'border-pt-coral shadow-[3px_3px_0px_#F04E59]' : '',
                    ].join(' ')}
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                  {errors.name && (
                    <p
                      className="mt-1 text-sm font-semibold"
                      style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-coral)' }}
                      role="alert"
                    >
                      ⚠️ {errors.name}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div className="mt-4">
                  <PTSelect
                    label="Role"
                    icon="💼"
                    value={form.role}
                    onChange={(e) => updateField('role', e.target.value as UserRole)}
                    hint="Pilih yang paling mendekati situasimu sekarang."
                  >
                    <option value="mahasiswa">🎓 Mahasiswa</option>
                    <option value="profesional">💼 Profesional / Karyawan</option>
                    <option value="freelancer">💻 Freelancer</option>
                    <option value="entrepreneur">🚀 Entrepreneur</option>
                    <option value="lainnya">✨ Lainnya</option>
                  </PTSelect>
                </div>
              </PTCard>
            </motion.div>

            {/* ---- SECTION 2: Goals & Problems ---- */}
            <motion.div variants={itemVariants}>
              <PTCard variant="white" padding="lg" accentColor="var(--pt-coral)" accentHeight={4}>
                <SectionLabel icon="🎯" label="Target & Hambatan" />

                {/* Big Goal */}
                <div className="mt-4">
                  <PTTextarea
                    label="Goal besar kamu"
                    icon="🏆"
                    value={form.bigGoal}
                    onChange={(e) => updateField('bigGoal', e.target.value)}
                    placeholder="Dalam 3–6 bulan ke depan, aku mau..."
                    wordLimit={100}
                    rows={3}
                    hint="Bisa jangka pendek atau panjang. Satu kalimat pun cukup."
                  />
                </div>

                {/* Current Problem */}
                <div className="mt-5">
                  <PTTextarea
                    label="Problem utama sekarang"
                    icon="🔥"
                    value={form.currentProblem}
                    onChange={(e) => updateField('currentProblem', e.target.value)}
                    placeholder="Sekarang yang paling bikin stuck adalah..."
                    wordLimit={100}
                    rows={3}
                    hint="Apa yang paling sering bikin kamu nggak produktif? Jujur aja."
                  />
                </div>
              </PTCard>
            </motion.div>

            {/* ---- SECTION 3: Style ---- */}
            <motion.div variants={itemVariants}>
              <PTCard variant="white" padding="lg" accentColor="var(--pt-green)" accentHeight={4}>
                <SectionLabel icon="⚡" label="Gaya Produktivitas" />

                {/* Energy Pattern */}
                <div className="mt-4">
                  <OptionLabel icon="🌞" label="Pola energi" />
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {ENERGY_OPTIONS.map((opt) => (
                      <PillOption
                        key={opt.value}
                        icon={opt.icon}
                        label={opt.label}
                        sublabel={opt.sublabel}
                        selected={form.energyPattern === opt.value}
                        accentColor={opt.color}
                        onClick={() => updateField('energyPattern', opt.value as EnergyPattern)}
                      />
                    ))}
                  </div>
                </div>

                <HandDrawnDivider variant="dots" color="var(--pt-black)" className="opacity-20 my-4" />

                {/* Preferred Style */}
                <div>
                  <OptionLabel icon="🗂️" label="Preferensi style kerja" />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {STYLE_OPTIONS.map((opt) => (
                      <PillOption
                        key={opt.value}
                        icon={opt.icon}
                        label={opt.label}
                        sublabel={opt.sublabel}
                        selected={form.preferredStyle === opt.value}
                        accentColor={opt.color}
                        onClick={() => updateField('preferredStyle', opt.value as PreferredStyle)}
                      />
                    ))}
                  </div>
                </div>
              </PTCard>
            </motion.div>

            {/* ---- SUBMIT ---- */}
            <motion.div variants={itemVariants} className="flex flex-col gap-3 pb-12">
              <PTButton
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                isLoading={isSaving}
                loadingText="Menyimpan..."
                className="w-full"
              >
                Lanjut Pilih Mode →
              </PTButton>

              <PTButton
                variant="ghost"
                size="md"
                onClick={() => router.back()}
                className="w-full"
                disabled={isSaving}
              >
                ← Kembali
              </PTButton>

              <p
                className="text-center text-sm"
                style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
              >
                Data hanya tersimpan di browser kamu. Tidak dikirim ke server.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

/* ---- Helper Components ---- */

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <span
        className="font-display text-h4"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--pt-black)' }}
      >
        {label}
      </span>
    </div>
  );
}

function OptionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      <span aria-hidden="true">{icon}</span>
      <span
        className="text-label font-bold uppercase tracking-wide"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
      >
        {label}
      </span>
    </div>
  );
}

interface PillOptionProps {
  icon:        string;
  label:       string;
  sublabel:    string;
  selected:    boolean;
  accentColor: string;
  onClick:     () => void;
}

function PillOption({
  icon, label, sublabel,
  selected, accentColor, onClick,
}: PillOptionProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      className={[
        'flex flex-col items-center gap-1 p-3',
        'rounded-sketch border-2 border-pt-black',
        'cursor-pointer transition-all duration-150',
        'text-center w-full',
        selected ? 'shadow-sketch' : 'shadow-none hover:shadow-sketch',
      ].join(' ')}
      style={{
        backgroundColor: selected ? accentColor : 'var(--pt-white)',
        transform: selected ? 'translate(-1px, -1px)' : undefined,
      }}
      aria-pressed={selected}
    >
      <span className="text-2xl" aria-hidden="true">{icon}</span>
      <span
        className="text-label font-bold leading-tight"
        style={{
          fontFamily: 'var(--font-body)',
          color: selected ? 'var(--pt-black)' : 'var(--pt-black)',
        }}
      >
        {label}
      </span>
      <span
        className="text-[10px] leading-tight"
        style={{
          fontFamily: 'var(--font-body)',
          color: '#6B6B6B',
        }}
      >
        {sublabel}
      </span>
    </motion.button>
  );
}

/* ---- Data ---- */

const ENERGY_OPTIONS = [
  {
    value:    'morning',
    icon:     '🌅',
    label:    'Morning',
    sublabel: 'Paling fokus pagi',
    color:    'var(--pt-yellow)',
  },
  {
    value:    'night',
    icon:     '🌙',
    label:    'Night Owl',
    sublabel: 'Paling produktif malam',
    color:    'var(--pt-blue)',
  },
  {
    value:    'variable',
    icon:     '🌊',
    label:    'Random',
    sublabel: 'Tergantung mood',
    color:    'var(--pt-cyan)',
  },
] as const;

const STYLE_OPTIONS = [
  {
    value:    'structured',
    icon:     '📐',
    label:    'Structured',
    sublabel: 'Suka jadwal & sistem yang jelas',
    color:    'var(--pt-lime)',
  },
  {
    value:    'flexible',
    icon:     '🌿',
    label:    'Flexible',
    sublabel: 'Suka flow yang adaptif',
    color:    'var(--pt-cream)',
  },
] as const;
