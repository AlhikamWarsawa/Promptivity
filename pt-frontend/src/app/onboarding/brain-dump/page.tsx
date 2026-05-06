'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PTButton }          from '@/components/pt/PTButton';
import { OnboardingTopBar }  from '@/components/pt/OnboardingTopBar';
import { WordCounter }        from '@/components/pt/WordCounter';
import { ProcessingOverlay, PT_PROCESSING_MESSAGES } from '@/components/pt/ProcessingOverlay';
import { HintCard }           from '@/components/pt/HintCard';
import { PTCard }             from '@/components/pt/PTCard';
import PTStorage              from '@/lib/storage';

/* ============================================
   /onboarding/brain-dump — Brain Dump Page
   
   Flow:
   1. User melihat prompt besar
   2. (Opsional) klik prompt starter → auto-isi teks awal
   3. User cerita bebas di textarea besar
   4. WordCounter menunjukkan progress ke 50 kata
   5. Tombol aktif saat >= 50 kata
   6. Klik "Build My Mission" → ProcessingOverlay tampil
   7. Simulasi loading 12 detik → redirect /dashboard
   
   Note: Day 5 = UI only. Koneksi AI di Day 6.
   ============================================ */

const MIN_WORDS  = 50;
const AUTO_SAVE_DELAY_MS = 800;   // Debounce auto-save ke localStorage

export default function BrainDumpPage() {
  const router              = useRouter();
  const textareaRef         = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [story, setStory]           = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [persona, setPersona]       = useState<{ name: string } | null>(null);
  const [showNudgeModal, setShowNudgeModal] = useState(false);

  // Load draft & persona dari localStorage saat mount
  useEffect(() => {
    const draft = PTStorage.getStoryDraft();
    if (draft) setStory(draft);

    const p = PTStorage.getPersona();
    if (p) setPersona({ name: p.name });
  }, []);

  // Count words
  const wordCount = story.trim().split(/\s+/).filter(Boolean).length;
  const isReady   = wordCount >= MIN_WORDS;

  // Auto-save ke localStorage (debounced)
  const handleStoryChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setStory(val);
    if (!hasStarted) setHasStarted(true);

    // Auto-resize textarea
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;

    // Debounced save
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      PTStorage.saveStoryDraft(val);
    }, AUTO_SAVE_DELAY_MS);
  }, [hasStarted]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // Prompt starters — klik auto-isi prefix ke textarea
  function applyStarter(starterText: string) {
    const newVal = story
      ? `${story}\n\n${starterText}`
      : starterText;
    setStory(newVal);
    PTStorage.saveStoryDraft(newVal);

    // Focus textarea setelah apply
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        // Cursor ke akhir
        const len = newVal.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, 50);
  }

  // Submit handler (Day 5 = simulation only)
  function handleBuildMission() {
    if (isProcessing) return;

    if (!isReady) {
      // Jangan disable — tampilkan nudge
      setShowNudgeModal(true);
      return;
    }

    PTStorage.saveStoryDraft(story);
    setIsProcessing(true);
  }

  // Called by ProcessingOverlay when messages finish
  function handleProcessingComplete() {
    router.push('/dashboard');
  }

  // Greet text
  const firstName  = persona?.name?.split(' ')[0] ?? null;
  const greetName  = firstName && firstName !== 'Friend' ? `, ${firstName}` : '';

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--pt-cream)' }}
    >
      {/* Top bar — step 3 */}
      <OnboardingTopBar currentStep={3} />

      {/* Processing overlay */}
      <ProcessingOverlay
        isVisible={isProcessing}
        messages={PT_PROCESSING_MESSAGES}
        onComplete={handleProcessingComplete}
      />

      {/* Nudge modal */}
      <NudgeModal
        isOpen={showNudgeModal}
        wordCount={wordCount}
        minWords={MIN_WORDS}
        onClose={() => setShowNudgeModal(false)}
        onContinueAnyway={() => {
          setShowNudgeModal(false);
          PTStorage.saveStoryDraft(story);
          setIsProcessing(true);
        }}
      />

      {/* Page content */}
      <div className="flex-1 px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">

          {/* Greeting */}
          <PersonaGreeting greetName={greetName} />

          {/* Main layout: 2 col desktop */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

            {/* ===== LEFT: Input Panel ===== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] as const }}
              className="flex flex-col gap-5"
            >
              {/* Main prompt */}
              <MainPromptDisplay />

              {/* Prompt starters */}
              <PromptStarters onSelect={applyStarter} />

              {/* Story textarea */}
              <div
                className="rounded-sketch border-2 border-pt-black overflow-hidden"
                style={{
                  backgroundColor: 'var(--pt-white)',
                  boxShadow: '4px 4px 0px #2B2B2B',
                }}
              >
                {/* Textarea header bar */}
                <div
                  className="flex items-center gap-2 px-4 py-2 border-b-2 border-pt-black"
                  style={{ backgroundColor: 'var(--pt-yellowP)' }}
                >
                  {/* Decorative "traffic lights" */}
                  {['var(--pt-coral)', 'var(--pt-mustard)', 'var(--pt-green)'].map((c, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full border border-pt-black/30"
                      style={{ backgroundColor: c }}
                      aria-hidden="true"
                    />
                  ))}
                  <span
                    className="ml-1 text-label font-bold text-pt-black/60"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    my_story.txt
                  </span>
                  {/* Auto-save indicator */}
                  <AnimatePresence>
                    {hasStarted && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="ml-auto text-[10px] font-body"
                        style={{ color: '#6B6B6B', fontFamily: 'var(--font-body)' }}
                      >
                        💾 auto-saved
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Textarea itself */}
                <textarea
                  ref={textareaRef}
                  value={story}
                  onChange={handleStoryChange}
                  placeholder={STORY_PLACEHOLDER}
                  className={[
                    'w-full px-5 py-5',
                    'text-body leading-relaxed',
                    'bg-transparent',
                    'resize-none overflow-hidden',
                    'focus:outline-none',
                    'placeholder:text-[#9B9B9B] placeholder:italic',
                  ].join(' ')}
                  style={{
                    fontFamily:  'var(--font-body)',
                    color:       'var(--pt-black)',
                    minHeight:   '280px',
                    fontSize:    '1rem',
                    lineHeight:  '1.8',
                  }}
                  aria-label="Ceritakan situasimu"
                  aria-required="true"
                  disabled={isProcessing}
                  spellCheck={false}
                />

                {/* Word counter (inside card, below textarea) */}
                <div
                  className="px-5 py-3 border-t border-pt-black/10"
                  style={{ backgroundColor: 'var(--pt-white)' }}
                >
                  <WordCounter wordCount={wordCount} minWords={MIN_WORDS} />
                </div>
              </div>

              {/* Submit button */}
              <SubmitSection
                isReady={isReady}
                isProcessing={isProcessing}
                wordCount={wordCount}
                minWords={MIN_WORDS}
                onSubmit={handleBuildMission}
              />
            </motion.div>

            {/* ===== RIGHT: Hint Card ===== */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
              className="lg:sticky lg:top-6"
            >
              <HintCard />

              {/* Extra: example story teaser */}
              <ExampleStoryCard />
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ============================================
   SUB-COMPONENTS
   ============================================ */

/* ---- Persona Greeting ---- */

function PersonaGreeting({ greetName }: { greetName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex items-center gap-3"
    >
      <div
        className="w-10 h-10 rounded-sketch border-2 border-pt-black flex items-center justify-center text-xl"
        style={{ backgroundColor: 'var(--pt-yellow)' }}
        aria-hidden="true"
      >
        👋
      </div>
      <p
        className="text-body"
        style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
      >
        Hei{greetName}! Ini waktunya cerita.
        Tulis sebebas mungkin — tidak perlu rapi.
      </p>
    </motion.div>
  );
}

/* ---- Main Prompt Display ---- */

function MainPromptDisplay() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize:   'clamp(1.6rem, 4vw, 2.5rem)',
          color:      'var(--pt-black)',
          lineHeight: 1.15,
        }}
      >
        Tell your story and we will{' '}
        <span
          className="relative inline-block"
          style={{ color: 'var(--pt-brown)' }}
        >
          make your mission.
          {/* Underline sketch */}
          <svg
            className="absolute -bottom-1 left-0 w-full"
            viewBox="0 0 200 8"
            height="8"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,5 C30,2 60,7 100,4 C140,1 170,6 200,4"
              stroke="var(--pt-coral)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </h1>
    </motion.div>
  );
}

/* ---- Prompt Starters ---- */

const PROMPT_STARTERS = [
  {
    emoji:  '📚',
    label:  'Kuliah',
    prefix: 'Saya lagi kuliah dan sedang menghadapi ',
  },
  {
    emoji:  '💼',
    label:  'Kerja',
    prefix: 'Saya lagi kerja dan situasinya sekarang adalah ',
  },
  {
    emoji:  '🚀',
    label:  'Project',
    prefix: 'Saya lagi mengerjakan project dan tantangan utamanya adalah ',
  },
] as const;

function PromptStarters({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="flex flex-wrap items-center gap-2"
    >
      <span
        className="text-sm shrink-0"
        style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
      >
        Mulai dari:
      </span>
      {PROMPT_STARTERS.map((starter) => (
        <motion.button
          key={starter.label}
          type="button"
          onClick={() => onSelect(starter.prefix)}
          whileHover={{ y: -2, scale: 1.03 }}
          whileTap={{ y: 0, scale: 0.97 }}
          className={[
            'inline-flex items-center gap-1.5',
            'px-3 py-1.5',
            'rounded-sketch border-2 border-pt-black',
            'text-sm font-semibold',
            'cursor-pointer',
            'transition-colors duration-150',
            'hover:bg-pt-yellowP',
          ].join(' ')}
          style={{
            fontFamily:      'var(--font-body)',
            color:           'var(--pt-black)',
            backgroundColor: 'var(--pt-white)',
            boxShadow:       '2px 2px 0px #2B2B2B',
          }}
        >
          <span aria-hidden="true">{starter.emoji}</span>
          <span>Saya lagi {starter.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}

/* ---- Submit Section ---- */

interface SubmitSectionProps {
  isReady:      boolean;
  isProcessing: boolean;
  wordCount:    number;
  minWords:     number;
  onSubmit:     () => void;
}

function SubmitSection({
  isReady, isProcessing, wordCount, minWords, onSubmit,
}: SubmitSectionProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <motion.div
        className="flex-1 sm:flex-none"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <PTButton
          variant={isReady ? 'primary' : 'outline'}
          size="lg"
          onClick={onSubmit}
          disabled={isProcessing}
          className="w-full sm:w-auto relative overflow-hidden"
          aria-label="Build My Mission"
        >
          {/* Shimmer hanya saat ready */}
          {isReady && (
            <motion.div
              className="absolute inset-0 bg-white/20"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            {isReady ? (
              <>✨ Build My Mission</>
            ) : (
              <>🚀 Build My Mission</>
            )}
          </span>
        </PTButton>
      </motion.div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        {!isReady ? (
          <motion.p
            key="not-ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            💬 Cerita lebih banyak = mission lebih akurat
          </motion.p>
        ) : (
          <motion.p
            key="ready"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-green)' }}
          >
            ✅ Siap diproses!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---- Nudge Modal ---- */

function NudgeModal({
  isOpen,
  wordCount,
  minWords,
  onClose,
  onContinueAnyway,
}: {
  isOpen:            boolean;
  wordCount:         number;
  minWords:          number;
  onClose:           () => void;
  onContinueAnyway:  () => void;
}) {
  const remaining = minWords - wordCount;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(43,43,43,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ y: 40, scale: 0.95 }}
            animate={{ y: 0,  scale: 1    }}
            exit={{ y: 40,   scale: 0.95  }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <PTCard
              variant="white"
              padding="lg"
              accentColor="var(--pt-mustard)"
              accentHeight={5}
            >
              {/* Moti mascot mini */}
              <div className="flex items-start gap-4">
                <div
                  className="shrink-0 w-14 h-14 rounded-sketch border-2 border-pt-black flex items-center justify-center text-3xl"
                  style={{ backgroundColor: 'var(--pt-yellowP)' }}
                  aria-hidden="true"
                >
                  🧠
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-h4)',
                      color: 'var(--pt-black)',
                    }}
                  >
                    Moti bilang: cerita dulu sedikit lagi! 😊
                  </h3>
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
                  >
                    Ceritamu sekarang punya <strong>{wordCount} kata</strong>.
                    Dengan {remaining} kata lagi, Moti bisa bikin mission yang jauh lebih akurat dan personal.
                  </p>
                </div>
              </div>

              {/* Suggestions */}
              <div
                className="mt-4 p-3 rounded-sketch border border-pt-black/20 space-y-1.5"
                style={{ backgroundColor: 'var(--pt-cream)' }}
              >
                <p
                  className="text-label font-bold"
                  style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
                >
                  Coba tambahkan:
                </p>
                {[
                  'Deadline atau tanggal penting yang ada',
                  'Hambatan atau distraksi yang sering muncul',
                  'Apa yang ingin dicapai minggu ini',
                ].map((s) => (
                  <p
                    key={s}
                    className="text-sm flex gap-2"
                    style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
                  >
                    <span style={{ color: 'var(--pt-mustard)' }}>→</span>
                    {s}
                  </p>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-5 flex flex-col gap-2">
                <PTButton
                  variant="primary"
                  size="md"
                  onClick={onClose}
                  className="w-full"
                >
                  ✍️ Tambah Cerita Dulu
                </PTButton>
                <PTButton
                  variant="ghost"
                  size="sm"
                  onClick={onContinueAnyway}
                  className="w-full"
                >
                  Lanjut saja dengan {wordCount} kata →
                </PTButton>
              </div>
            </PTCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---- Example Story Card ---- */

function ExampleStoryCard() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mt-4"
    >
      <div
        className="rounded-sketch border-2 border-pt-black overflow-hidden"
        style={{ backgroundColor: 'var(--pt-white)' }}
      >
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          style={{ backgroundColor: 'var(--pt-lime)' }}
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-2">
            <span aria-hidden="true">👀</span>
            <span
              className="text-label font-bold"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
            >
              Lihat contoh cerita
            </span>
          </div>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-pt-black/60"
            aria-hidden="true"
          >
            ▾
          </motion.span>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
              className="overflow-hidden"
            >
              <div className="px-4 py-3">
                <p
                  className="text-sm leading-relaxed italic"
                  style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
                >
                  &ldquo;Saya mahasiswa semester 5, lagi skripsi sambil magang part-time 3x seminggu.
                  Deadline pengumpulan bab 3 minggu depan tapi saya belum mulai outline.
                  Dosen pembimbing minta revisi bab 2 juga. Di magang ada sprint review Jumat ini.
                  Saya sering distracted sama medsos, tidur jam 2 pagi, bangun siang.
                  Energi paling bagus jam 10 malam. Mau lebih produktif tapi nggak tahu mulai dari mana.&rdquo;
                </p>
                <p
                  className="mt-2 text-[11px]"
                  style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
                >
                  ↑ Contoh cerita yang akan menghasilkan mission plan yang kuat
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ============================================
   CONSTANTS
   ============================================ */

const STORY_PLACEHOLDER = `Contoh:

Saya lagi kerja di startup sambil freelance desain grafis untuk 2 klien. 
Deadline proyek utama hari Jumat, tapi klien freelance minta revisi mendadak. 
Belum sempat olahraga 3 minggu karena selalu ada aja yang urgent. 
Mau belajar TypeScript tapi nggak ada waktu. 
Tidur nggak teratur, kadang 5 jam kadang 9 jam. 
Meeting hampir setiap hari dan sering ganggu deep work.
Perasaan overwhelmed hampir tiap hari...

Ceritamu tidak harus seperti ini — tulis apa saja yang ada di pikiranmu.`;
