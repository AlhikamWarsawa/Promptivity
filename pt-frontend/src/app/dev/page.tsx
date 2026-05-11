'use client';

import { PTButton } from '@/components/pt/PTButton';
import { PTCard, PTCardHeader, PTCardTitle, PTCardDescription, PTCardContent, PTCardFooter } from '@/components/pt/PTCard';
import { PTBadge, PriorityBadge } from '@/components/pt/PTBadge';
import { HandDrawnDivider } from '@/components/pt/HandDrawnDivider';
import {
  DisplayTitle, SectionTitle, CardTitle,
  BodyText, SmallText, LabelText,
} from '@/components/pt/Typography';
import { FRAMEWORK_LIST } from '@/lib/frameworkConfig';
import { WordCounter }        from '@/components/pt/WordCounter';
import { HintCard }           from '@/components/pt/HintCard';
import { PTInput }            from '@/components/pt/PTInput';
import { TaskCard }           from '@/components/pt/TaskCard';
import { FrameworkCard }      from '@/components/pt/FrameworkCard';
import { ScoreBar }           from '@/components/pt/ScoreBar';
import { TodayPlanPanel }     from '@/components/pt/TodayPlanPanel';
import type { Task, FrameworkOutput, FrameworkRawData } from '@/types/pt.types';

// ---- Mock data untuk preview ----
const MOCK_TASK: Task = {
  id: 'dev_001', title: 'Selesaikan bab 3 skripsi', priority: 'critical',
  estimatedMinutes: 120, deadline: '2025-08-15', category: 'learning',
  isCompleted: false, framework: 'gtd', description: 'Fokus pada metodologi penelitian',
};

const MOCK_TASK_DONE: Task = {
  ...MOCK_TASK, id: 'dev_002', title: 'Review literatur', priority: 'high',
  isCompleted: true, estimatedMinutes: 60,
};

const MOCK_FW: FrameworkOutput = {
  frameworkId: 'eat-the-frog', isRecommended: true, recommendationScore: 87,
  recommendationReason: 'Kamu punya satu tugas besar yang ditunda-tunda. Eat the Frog dirancang tepat untuk ini.',
  tasks: [], todayActions: ['Kerjakan outline bab 3 dalam 90 menit pertama pagi ini'],
  rawData: {} as FrameworkRawData,
};

/* ============================================
   /dev — PT Component Preview (Storybook-lite)
   Hanya untuk development. Hapus dari produksi.
   ============================================ */

export default function DevPage() {
  return (
    <main
      className="min-h-screen p-8 space-y-16"
      style={{ backgroundColor: 'var(--pt-white)' }}
    >
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <DisplayTitle>PT Design System</DisplayTitle>
        <BodyText className="mt-2 text-[#6B6B6B]">
          Component preview — development only. Style: MS Paint × Kids Book × Modern Clean.
        </BodyText>
      </div>

      <HandDrawnDivider variant="scribble" label="🎨 COLOR PALETTE" />

      {/* ---- PALETTE SECTION ---- */}
      <Section title="Color Palette">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-15">
          {PALETTE.map(({ name, hex }) => (
            <div key={hex} className="flex flex-col gap-1">
              <div
                className="w-full aspect-square rounded-sketch border-2 border-pt-black shadow-sketch"
                style={{ backgroundColor: hex }}
              />
              <LabelText className="text-[9px] text-pt-black">{name}</LabelText>
              <SmallText className="text-[9px] font-mono">{hex}</SmallText>
            </div>
          ))}
        </div>
      </Section>

      <HandDrawnDivider variant="wave" label="Aa TYPOGRAPHY" />

      {/* ---- TYPOGRAPHY SECTION ---- */}
      <Section title="Typography Scale">
        <div className="space-y-4">
          <div className="p-4 bg-pt-cream rounded-sketch border-2 border-pt-black">
            <LabelText>H1 — Gaegu 48px</LabelText>
            <DisplayTitle>The Quick Brown Fox</DisplayTitle>
          </div>
          <div className="p-4 bg-pt-cream rounded-sketch border-2 border-pt-black">
            <LabelText>H2 — Gaegu 36px</LabelText>
            <SectionTitle>Your Mission Awaits</SectionTitle>
          </div>
          <div className="p-4 bg-pt-cream rounded-sketch border-2 border-pt-black">
            <LabelText>H3 — Gaegu 24px</LabelText>
            <CardTitle>Today&apos;s Plan</CardTitle>
          </div>
          <div className="p-4 bg-pt-cream rounded-sketch border-2 border-pt-black">
            <LabelText>Body — DM Sans 16px</LabelText>
            <BodyText>
              PT mengubah cerita user menjadi mission plan terstruktur. User cukup cerita masalah,
              tugas, deadline, dan kondisi hidup mereka.
            </BodyText>
          </div>
          <div className="p-4 bg-pt-cream rounded-sketch border-2 border-pt-black">
            <LabelText>Small — DM Sans 14px muted</LabelText>
            <SmallText>Created 2 hours ago · 5 tasks · 3 frameworks recommended</SmallText>
          </div>
          <div className="p-4 bg-pt-cream rounded-sketch border-2 border-pt-black">
            <LabelText>Label — DM Sans 12px bold</LabelText>
            <div className="flex gap-4 mt-1">
              <LabelText>PRIORITY</LabelText>
              <LabelText>DEADLINE</LabelText>
              <LabelText>STATUS</LabelText>
            </div>
          </div>
        </div>
      </Section>

      <HandDrawnDivider variant="zigzag" label="🔘 BUTTONS" />

      {/* ---- BUTTON SECTION ---- */}
      <Section title="PTButton">
        <div className="space-y-6">

          <div>
            <LabelText className="mb-3 block">Variants</LabelText>
            <div className="flex flex-wrap gap-3">
              <PTButton variant="primary">Primary Button</PTButton>
              <PTButton variant="secondary">Secondary Button</PTButton>
              <PTButton variant="danger">Danger Button</PTButton>
              <PTButton variant="success">Success Button</PTButton>
              <PTButton variant="ghost">Ghost Button</PTButton>
              <PTButton variant="outline">Outline Button</PTButton>
            </div>
          </div>

          <div>
            <LabelText className="mb-3 block">Sizes</LabelText>
            <div className="flex flex-wrap items-center gap-3">
              <PTButton size="sm">Small</PTButton>
              <PTButton size="md">Medium (default)</PTButton>
              <PTButton size="lg">Large CTA</PTButton>
            </div>
          </div>

          <div>
            <LabelText className="mb-3 block">States</LabelText>
            <div className="flex flex-wrap gap-3">
              <PTButton isLoading loadingText="Processing...">Submit</PTButton>
              <PTButton disabled>Disabled</PTButton>
            </div>
          </div>

          <div>
            <LabelText className="mb-3 block">Hover me — feel the sketch press!</LabelText>
            <PTButton variant="primary" size="lg">
              ✨ Build My Mission
            </PTButton>
          </div>
        </div>
      </Section>

      <HandDrawnDivider variant="dots" label="🏷️ BADGES" />

      {/* ---- BADGE SECTION ---- */}
      <Section title="PTBadge & PriorityBadge">
        <div className="space-y-6">

          <div>
            <LabelText className="mb-3 block">Priority Badges</LabelText>
            <div className="flex flex-wrap gap-3">
              <PriorityBadge priority="critical" />
              <PriorityBadge priority="high" />
              <PriorityBadge priority="medium" />
              <PriorityBadge priority="low" />
            </div>
          </div>

          <div>
            <LabelText className="mb-3 block">Priority Badges — No Icon</LabelText>
            <div className="flex flex-wrap gap-3">
              <PriorityBadge priority="critical" showIcon={false} />
              <PriorityBadge priority="high" showIcon={false} />
              <PriorityBadge priority="medium" showIcon={false} />
              <PriorityBadge priority="low" showIcon={false} />
            </div>
          </div>

          <div>
            <LabelText className="mb-3 block">Semantic Badges</LabelText>
            <div className="flex flex-wrap gap-3">
              <PTBadge variant="info" dot>Info</PTBadge>
              <PTBadge variant="success" icon="✅">Success</PTBadge>
              <PTBadge variant="warning" icon="⚠️">Warning</PTBadge>
              <PTBadge variant="neutral">Neutral</PTBadge>
              <PTBadge variant="outline">Outline</PTBadge>
            </div>
          </div>

          <div>
            <LabelText className="mb-3 block">Small size</LabelText>
            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority="critical" size="sm" />
              <PriorityBadge priority="high" size="sm" />
              <PTBadge variant="info" size="sm">Recommended</PTBadge>
            </div>
          </div>
        </div>
      </Section>

      <HandDrawnDivider variant="wave" label="📋 CARDS" />

      {/* ---- CARD SECTION ---- */}
      <Section title="PTCard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <PTCard variant="default">
            <PTCardHeader>
              <PTCardTitle>Default Card</PTCardTitle>
              <PTCardDescription>Cream background, sketch border</PTCardDescription>
            </PTCardHeader>
            <PTCardContent>
              <BodyText>Card content goes here. This is how most cards in PT will look.</BodyText>
            </PTCardContent>
            <PTCardFooter>
              <PTButton size="sm">Action</PTButton>
            </PTCardFooter>
          </PTCard>

          <PTCard variant="white" accentColor="#F04E59">
            <PTCardHeader>
              <PTCardTitle>With Accent Color</PTCardTitle>
              <PTCardDescription>Top border accent — coral</PTCardDescription>
            </PTCardHeader>
            <PTCardContent>
              <BodyText>Each framework card gets its accent color on top.</BodyText>
            </PTCardContent>
          </PTCard>

          <PTCard variant="sticky">
            <CardTitle>Sticky Note Card</CardTitle>
            <BodyText className="mt-2">Slight rotation, yellow-p background. Perfect for &quot;Today&apos;s Plan&quot; panel.</BodyText>
          </PTCard>

          <PTCard variant="elevated">
            <PTCardTitle>Elevated Card</PTCardTitle>
            <PTCardDescription>Bigger shadow for featured content</PTCardDescription>
          </PTCard>

          <PTCard variant="default" hoverable accentColor="#2196E8">
            <PTCardTitle>Hoverable Card</PTCardTitle>
            <PTCardDescription>Hover me — lifts up!</PTCardDescription>
            <BodyText className="mt-3">Used for framework cards in the dashboard grid.</BodyText>
          </PTCard>

          <PTCard variant="flat">
            <PTCardTitle>Flat Card</PTCardTitle>
            <PTCardDescription>No shadow — for nested content</PTCardDescription>
          </PTCard>
        </div>
      </Section>

      <HandDrawnDivider variant="scribble" label="〰️ DIVIDERS" />

      {/* ---- DIVIDER SECTION ---- */}
      <Section title="HandDrawnDivider">
        <div className="space-y-8">
          {(['wave', 'zigzag', 'dots', 'scribble'] as const).map((v) => (
            <div key={v}>
              <LabelText className="mb-2 block">{v}</LabelText>
              <HandDrawnDivider variant={v} color="#2B2B2B" />
            </div>
          ))}
          <div>
            <LabelText className="mb-2 block">With label</LabelText>
            <HandDrawnDivider variant="wave" label="TODAY'S FOCUS" color="#F28C28" />
          </div>
          <div>
            <LabelText className="mb-2 block">Custom color — coral</LabelText>
            <HandDrawnDivider variant="zigzag" color="#F04E59" strokeWidth={2.5} />
          </div>
        </div>
      </Section>

      <HandDrawnDivider variant="wave" label="🗂️ FRAMEWORK CARDS" />

      {/* ---- FRAMEWORK PREVIEW ---- */}
      <Section title="Framework Card Preview (semua 15)">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {FRAMEWORK_LIST.map((fw) => (
            <PTCard
              key={fw.id}
              variant="white"
              padding="md"
              hoverable
              accentColor={fw.accentColor}
            >
              <div className="mb-2">
                {fw.icon && <fw.icon size={32} />}
              </div>
              <CardTitle className="text-[1rem] leading-tight">{fw.shortName}</CardTitle>
              <SmallText className="mt-1 line-clamp-2">{fw.tagline}</SmallText>
              <div className="mt-3">
                <PTBadge variant="neutral" size="sm">{fw.id}</PTBadge>
              </div>
            </PTCard>
          ))}
        </div>
      </Section>

      {/* Section WordCounter */}
      <HandDrawnDivider variant="wave" label="🔢 WORD COUNTER" />
      <Section title="WordCounter">
        <div className="max-w-lg space-y-8">
          <div>
            <LabelText className="mb-2 block">0 kata (belum mulai)</LabelText>
            <WordCounter wordCount={0} minWords={50} />
          </div>
          <div>
            <LabelText className="mb-2 block">15 kata (dalam perjalanan)</LabelText>
            <WordCounter wordCount={15} minWords={50} />
          </div>
          <div>
            <LabelText className="mb-2 block">35 kata (hampir sampai)</LabelText>
            <WordCounter wordCount={35} minWords={50} />
          </div>
          <div>
            <LabelText className="mb-2 block">50+ kata (ready!)</LabelText>
            <WordCounter wordCount={67} minWords={50} />
          </div>
        </div>
      </Section>

      {/* Section HintCard */}
      <HandDrawnDivider variant="zigzag" label="💡 HINT CARD" />
      <Section title="HintCard">
        <div className="max-w-sm">
          <HintCard />
        </div>
      </Section>

      {/* Section PTInput */}
      <HandDrawnDivider variant="dots" label="✏️ PT INPUT" />
      <Section title="PTInput">
        <div className="max-w-md space-y-4">
          <PTInput label="Nama" icon="👤" placeholder="Ketik nama kamu..." required />
          <PTInput label="Email" icon="📧" placeholder="email@example.com" type="email" hint="Tidak akan di-spam." />
          <PTInput label="Dengan error" error="Field ini wajib diisi." />
        </div>
      </Section>

      <HandDrawnDivider variant="wave" label="📊 SCORE BAR" />
      <Section title="ScoreBar">
        <div className="max-w-md space-y-6">
          <div><LabelText className="mb-2 block">Bar variant</LabelText>
            <ScoreBar score={87} variant="bar" size="md" /></div>
          <div><LabelText className="mb-2 block">Stars variant</LabelText>
            <ScoreBar score={72} variant="stars" size="md" /></div>
          <div><LabelText className="mb-2 block">Compact variant</LabelText>
            <ScoreBar score={45} variant="compact" /></div>
          <div><LabelText className="mb-2 block">Score rendah (merah)</LabelText>
            <ScoreBar score={22} variant="bar" size="sm" /></div>
        </div>
      </Section>

      <HandDrawnDivider variant="zigzag" label="✅ TASK CARD" />
      <Section title="TaskCard">
        <div className="max-w-lg space-y-3">
          <TaskCard task={MOCK_TASK} onToggle={(id) => console.log('toggle', id)} />
          <TaskCard task={MOCK_TASK_DONE} onToggle={(id) => console.log('toggle', id)} />
          <TaskCard task={{ ...MOCK_TASK, id: 'dev_003', priority: 'medium', title: 'Revisi bab 2 sesuai feedback dosen', estimatedMinutes: 45, deadline: undefined }} onToggle={() => {}} compact />
        </div>
      </Section>

      <HandDrawnDivider variant="dots" label="🗂️ FRAMEWORK CARD (GRID)" />
      <Section title="FrameworkCard — Grid variant">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-w-2xl">
          {FRAMEWORK_LIST.slice(0, 6).map((fw) => (
            <FrameworkCard
              key={fw.id}
              framework={{ frameworkId: fw.id, isRecommended: fw.id === 'eat-the-frog', recommendationScore: Math.floor(Math.random() * 40) + 50, recommendationReason: '', tasks: [], todayActions: [], rawData: {} as FrameworkRawData }}
              isTop={fw.id === 'eat-the-frog'}
              variant="grid"
            />
          ))}
        </div>
      </Section>

      <HandDrawnDivider variant="scribble" label="📋 TODAY PLAN PANEL" />
      <Section title="TodayPlanPanel">
        <div className="max-w-xs">
          <TodayPlanPanel actions={[
            'Mulai bab 3 dengan outline 30 menit',
            'Reply email klien sebelum jam 12',
            'Review PR yang sudah pending 2 hari',
          ]} />
        </div>
      </Section>

      {/* Footer */}
      <div className="text-center pb-16">
        <HandDrawnDivider variant="scribble" />
        <SmallText className="mt-4">PT Design System — Day 2 ✅</SmallText>
      </div>
    </main>
  );
}

/* ---- Helper Components ---- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="max-w-5xl mx-auto space-y-4">
      <SectionTitle className="text-[1.5rem]">{title}</SectionTitle>
      {children}
    </section>
  );
}

/* ---- Palette Data ---- */

const PALETTE = [
  { name: 'White',    hex: '#F3F3F1' },
  { name: 'Cream',    hex: '#E9DCCF' },
  { name: 'Yellow P', hex: '#F6E37A' },
  { name: 'Yellow',   hex: '#F5D60D' },
  { name: 'Orange',   hex: '#F28C28' },
  { name: 'Coral',    hex: '#F04E59' },
  { name: 'Cyan',     hex: '#35D5F4' },
  { name: 'Blue',     hex: '#2196E8' },
  { name: 'Lime',     hex: '#9AD84B' },
  { name: 'Green',    hex: '#17B66A' },
  { name: 'Mustard',  hex: '#E9B12A' },
  { name: 'Brown',    hex: '#B85B3C' },
  { name: 'Black',    hex: '#2B2B2B' },
];
