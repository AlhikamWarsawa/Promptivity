'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { DashboardNav } from '@/components/pt/DashboardNav';
import PTStorage from '@/lib/storage';
import { PTButton } from '@/components/pt/PTButton';
import { PriorityBadge } from '@/components/pt/PTBadge';
import { getFramework } from '@/lib/frameworkConfig';
import { usePTStore } from '@/store/usePTStore';
import { API } from '@/lib/api';
import type { PTSession } from '@/types/pt.types';

export default function JournalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dateStr = params.date as string;
  
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<PTSession | null>(null);

  const [notes, setNotes] = useState('');
  const isAuthenticated = usePTStore((s) => s.isAuthenticated);

  useEffect(() => {
    setMounted(true);
    
    async function fetchSession() {
      // Try local first
      const stored = PTStorage.getSessionsByDate(dateStr);
      if (stored.length > 0) {
        const sess = stored[stored.length - 1];
        setSession(sess);
        setNotes((sess as any).reflection_notes || '');
      } else if (isAuthenticated) {
        // Try backend
        try {
          const backendSessions = await API.get<any[]>('/sessions');
          const sess = backendSessions.find(s => s.session_date === dateStr);
          if (sess) {
            setSession(sess.data);
            setNotes(sess.reflection_notes || '');
          } else {
            router.push('/journal');
          }
        } catch (e) {
          router.push('/journal');
        }
      } else {
        router.push('/journal');
      }
    }
    fetchSession();
  }, [dateStr, router, isAuthenticated]);

  const handleSaveNotes = async () => {
    if (isAuthenticated && session) {
      try {
        await API.put(`/sessions/${session.sessionId}/notes`, { notes });
      } catch (e) {
        console.error('Failed to save notes to backend:', e);
      }
    }
    // Local save logic could go here too
  };

  if (!mounted || !session) return null;

  const formattedDate = new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-pt-white">
      <DashboardNav />
      
      <main className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <p className="text-label font-bold uppercase tracking-widest text-pt-brown">Past Mission</p>
            <h1 className="text-h2 font-display text-pt-black">{formattedDate}</h1>
          </div>
          <PTButton variant="outline" onClick={() => router.push('/journal')}>
            ← Back to Journal
          </PTButton>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Summary & Story */}
          <div className="lg:col-span-2 space-y-8">
            <section className="p-6 rounded-sketch border-2 border-pt-black bg-pt-cream shadow-sketch">
              <h2 className="text-h4 font-display mb-3">User Story</h2>
              <p className="text-sm italic leading-relaxed text-pt-brown">
                "{session.story.rawText}"
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-h4 font-display flex items-center gap-2">
                📋 Master Task List
              </h2>
              <div className="space-y-3">
                {session.masterTaskList.map((task) => (
                  <div 
                    key={task.id}
                    className="p-4 rounded-sketch border-2 border-pt-black bg-pt-white flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-sm border-2 border-pt-black ${task.isCompleted ? 'bg-pt-green' : 'bg-pt-white'}`} />
                      <span className={`font-bold ${task.isCompleted ? 'line-through opacity-50' : ''}`}>
                        {task.title}
                      </span>
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                ))}
              </div>
            </section>

            <section className="p-6 rounded-sketch border-2 border-pt-black bg-white shadow-sketch">
              <h2 className="text-h4 font-display mb-4 flex items-center gap-2">
                ✍️ Reflection Notes
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="How did your day go? What did you learn? Any blockers?"
                className="w-full h-40 p-4 rounded-sketch border-2 border-pt-black font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pt-yellow"
              />
              <p className="text-[10px] text-pt-brown mt-2 italic">
                Notes are auto-saved to your {isAuthenticated ? 'account' : 'local device'} when you click away.
              </p>
            </section>
          </div>

          {/* Right Column: Recommendations & Stats */}
          <div className="space-y-6">
            <section className="p-6 rounded-sketch border-2 border-pt-black bg-pt-yellow shadow-sketch">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-pt-brown uppercase">Top Framework</p>
                  <p className="font-display text-xl">{getFramework(session.topRecommendation as any)?.name ?? session.topRecommendation}</p>
                </div>
                <div className="h-px bg-pt-black/10" />
                <div>
                  <p className="text-xs font-bold text-pt-brown uppercase">Reason</p>
                  <p className="text-sm mt-1">{session.topRecommendationReason}</p>
                </div>
              </div>
            </section>

            <section className="p-6 rounded-sketch border-2 border-pt-black bg-pt-white shadow-sketch">
              <h2 className="text-label font-bold uppercase mb-4 tracking-wider">Productivity Score</h2>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-display text-pt-blue">
                  {Math.round((session.masterTaskList.filter(t => t.isCompleted).length / session.masterTaskList.length) * 100) || 0}
                </div>
                <div className="text-sm text-pt-brown">
                  tasks completed<br />out of {session.masterTaskList.length}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
