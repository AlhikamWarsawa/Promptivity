import React from 'react';
import type { FrameworkId } from '@/types/pt.types';
import * as Icons from '@/components/pt/icons';

export interface FrameworkMeta {
  id: FrameworkId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  accentColor: string;        // CSS hex color dari palette PT
  bgColor: string;            // Background warna muda/pastel untuk card
  icon: React.ElementType;    // Custom SVG Component
  route: string;
  bestFor: string[];          // Tipe user yang cocok
  keywords: string[];         // Keyword yang AI pakai untuk match ke story
}

export const FRAMEWORKS: Record<FrameworkId, FrameworkMeta> = {
  'gtd': {
    id: 'gtd',
    name: 'Getting Things Done',
    shortName: 'GTD',
    tagline: 'Capture everything. Trust your system.',
    description: 'GTD membantu kamu menangkap semua pikiran dan tugas ke dalam sistem terpercaya, sehingga otak bebas untuk fokus mengerjakan — bukan mengingat.',
    accentColor: '#2196E8',
    bgColor: '#E8F4FD',
    icon: Icons.GTDIcon,
    route: '/frameworks/gtd',
    bestFor: ['structured', 'profesional', 'mahasiswa'],
    keywords: ['banyak tugas', 'overwhelmed', 'lupa', 'inbox penuh', 'proyek besar'],
  },
  'kanban': {
    id: 'kanban',
    name: 'Kanban',
    shortName: 'Kanban',
    tagline: 'Visualize your work. Limit your load.',
    description: 'Kanban menggunakan board visual tiga kolom (Backlog, In Progress, Done) untuk mengelola alur kerja dengan jelas dan mencegah multitasking berlebihan.',
    accentColor: '#35D5F4',
    bgColor: '#E0F9FE',
    icon: Icons.KanbanIcon,
    route: '/frameworks/kanban',
    bestFor: ['flexible', 'freelancer', 'tim'],
    keywords: ['alur kerja', 'sprint', 'progres', 'banyak project', 'kolaborasi'],
  },
  'time-blocking': {
    id: 'time-blocking',
    name: 'Time Blocking',
    shortName: 'Time Block',
    tagline: 'Own your calendar. Own your day.',
    description: 'Time Blocking mengalokasikan setiap jam harimu ke tugas spesifik — tidak ada waktu yang terbuang tanpa tujuan.',
    accentColor: '#E9B12A',
    bgColor: '#FDF5E0',
    icon: Icons.TimeBlockingIcon,
    route: '/frameworks/time-blocking',
    bestFor: ['structured', 'morning', 'profesional'],
    keywords: ['deadline ketat', 'manajemen waktu', 'jadwal padat', 'distraksi'],
  },
  'eat-the-frog': {
    id: 'eat-the-frog',
    name: 'Eat the Frog',
    shortName: 'Eat the Frog',
    tagline: 'Do the hardest thing first. Everything else is easy.',
    description: 'Kerjakan tugas terberat dan paling penting di pagi hari pertama kali. Setelah "katak" termakan, sisa hari terasa ringan.',
    accentColor: '#F04E59',
    bgColor: '#FEE8EA',
    icon: Icons.EatTheFrogIcon,
    route: '/frameworks/eat-the-frog',
    bestFor: ['procrastinator', 'mahasiswa', 'flexible'],
    keywords: ['prokrastinasi', 'takut mulai', 'tugas besar', 'menunda'],
  },
  'pomodoro': {
    id: 'pomodoro',
    name: 'Pomodoro Technique',
    shortName: 'Pomodoro',
    tagline: '25 minutes of focus. 5 minutes of freedom.',
    description: 'Kerja dalam sesi fokus 25 menit, istirahat 5 menit, ulangi. Teknik ini melatih konsentrasi dan mencegah burnout.',
    accentColor: '#F28C28',
    bgColor: '#FEF0E0',
    icon: Icons.PomodoroIcon,
    route: '/frameworks/pomodoro',
    bestFor: ['distracted', 'mahasiswa', 'freelancer'],
    keywords: ['distraksi', 'susah fokus', 'kelelahan', 'ADHD', 'belajar'],
  },
  'eisenhower': {
    id: 'eisenhower',
    name: 'Eisenhower Matrix',
    shortName: 'Eisenhower',
    tagline: 'Separate the urgent from the important.',
    description: 'Matriks 2x2 yang membagi tugas ke dalam 4 kuadran: Lakukan Sekarang, Jadwalkan, Delegasikan, atau Hapus.',
    accentColor: '#F5D60D',
    bgColor: '#FFFCE0',
    icon: Icons.EisenhowerIcon,
    route: '/frameworks/eisenhower',
    bestFor: ['structured', 'profesional', 'entrepreneur'],
    keywords: ['prioritas', 'keputusan', 'banyak permintaan', 'urgent vs penting'],
  },
  'systemist': {
    id: 'systemist',
    name: 'Systemist',
    shortName: 'Systemist',
    tagline: 'Build systems. Not goals.',
    description: 'Systemist mendorong kamu membangun rutinitas dan sistem harian yang konsisten — bukan mengejar target sekali, tapi membangun habit jangka panjang.',
    accentColor: '#17B66A',
    bgColor: '#E0F8EE',
    icon: Icons.SystemistIcon,
    route: '/frameworks/systemist',
    bestFor: ['structured', 'entrepreneur', 'self-improvement'],
    keywords: ['rutinitas', 'kebiasaan', 'konsisten', 'habit', 'sistem produktivitas'],
  },
  'medium-method': {
    id: 'medium-method',
    name: 'The Medium Method',
    shortName: 'Medium Method',
    tagline: 'One big thing. A few support things. That is it.',
    description: 'Pilih satu tugas utama per hari yang benar-benar bermakna, ditambah dua atau tiga tugas pendukung. Simpel, fokus, sustainable.',
    accentColor: '#9AD84B',
    bgColor: '#F0FADF',
    icon: Icons.MediumMethodIcon,
    route: '/frameworks/medium-method',
    bestFor: ['flexible', 'burnout', 'overwhelmed'],
    keywords: ['burnout', 'terlalu banyak', 'kesederhanaan', 'fokus harian'],
  },
  'okrs': {
    id: 'okrs',
    name: 'Objectives & Key Results',
    shortName: 'OKRs',
    tagline: 'Set ambitious goals. Measure what matters.',
    description: 'OKR menetapkan satu Objective inspiratif dan 3–5 Key Results terukur untuk melacak kemajuan secara jelas dan ambisius.',
    accentColor: '#2196E8',
    bgColor: '#E8F4FD',
    icon: Icons.OKRIcon,
    route: '/frameworks/okrs',
    bestFor: ['entrepreneur', 'profesional', 'structured'],
    keywords: ['target besar', 'ambisi', 'KPI', 'growth', 'bisnis'],
  },
  'weekly-review': {
    id: 'weekly-review',
    name: 'Weekly Review',
    shortName: 'Weekly Review',
    tagline: 'Reflect. Reset. Recommit.',
    description: 'Setiap akhir minggu, evaluasi apa yang selesai, apa yang macet, dan rencanakan minggu depan. Refleksi yang konsisten adalah kunci perbaikan berkelanjutan.',
    accentColor: '#E9DCCF',
    bgColor: '#FAF5EF',
    icon: Icons.WeeklyReviewIcon,
    route: '/frameworks/weekly-review',
    bestFor: ['structured', 'self-improvement'],
    keywords: ['evaluasi', 'refleksi', 'minggu depan', 'review', 'introspeksi'],
  },
  'commitment-inventory': {
    id: 'commitment-inventory',
    name: 'Commitment Inventory',
    shortName: 'Commitment',
    tagline: 'Know what you owe. Know what to let go.',
    description: 'Buat daftar semua komitmenmu — pekerjaan, sosial, belajar, personal — lalu evaluasi mana yang perlu dilanjutkan, didelegasikan, atau dihapus.',
    accentColor: '#E9B12A',
    bgColor: '#FDF5E0',
    icon: Icons.CommitmentInventoryIcon,
    route: '/frameworks/commitment-inventory',
    bestFor: ['overwhelmed', 'profesional', 'entrepreneur'],
    keywords: ['terlalu banyak komitmen', 'overcommit', 'burnout', 'susah bilang tidak'],
  },
  'smart-goals': {
    id: 'smart-goals',
    name: 'SMART Goals',
    shortName: 'SMART Goals',
    tagline: 'Goals that are specific enough to achieve.',
    description: 'SMART Goals memastikan setiap targetmu bersifat Specific, Measurable, Achievable, Relevant, dan Time-bound — bukan sekadar harapan kabur.',
    accentColor: '#35D5F4',
    bgColor: '#E0F9FE',
    icon: Icons.SMARTGoalsIcon,
    route: '/frameworks/smart-goals',
    bestFor: ['structured', 'mahasiswa', 'profesional'],
    keywords: ['target jelas', 'deadline', 'tujuan hidup', 'goal setting'],
  },
  'para': {
    id: 'para',
    name: 'PARA Method',
    shortName: 'PARA',
    tagline: 'Organize everything. Find anything.',
    description: 'PARA mengorganisir semua informasi dan proyek ke dalam 4 kategori: Projects (aktif), Areas (tanggung jawab), Resources (referensi), Archives (tidak aktif).',
    accentColor: '#9AD84B',
    bgColor: '#F0FADF',
    icon: Icons.PARAIcon,
    route: '/frameworks/para',
    bestFor: ['knowledge-worker', 'structured', 'profesional'],
    keywords: ['organisasi informasi', 'banyak dokumen', 'notes', 'knowledge management'],
  },
};

export const FRAMEWORK_LIST = Object.values(FRAMEWORKS);
export const FRAMEWORK_IDS = Object.keys(FRAMEWORKS) as FrameworkId[];

export function getFramework(id: FrameworkId): FrameworkMeta {
  return FRAMEWORKS[id];
}

export function getRecommendedFrameworks(
  ids: FrameworkId[],
  limit = 3
): FrameworkMeta[] {
  return ids.slice(0, limit).map((id) => FRAMEWORKS[id]);
}
