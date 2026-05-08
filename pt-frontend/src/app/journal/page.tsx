'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DashboardNav } from '@/components/pt/DashboardNav';
import PTStorage from '@/lib/storage';
import { PTLogo } from '@/components/pt/icons';
import { usePTStore } from '@/store/usePTStore';
import { API } from '@/lib/api';

export default function JournalPage() {
  const [mounted, setMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sessionDates, setSessionDates] = useState<string[]>([]);

  const [sessions, setSessions] = useState<any[]>([]);
  const isAuthenticated = usePTStore((s) => s.isAuthenticated);

  useEffect(() => {
    setMounted(true);
    const localDates = PTStorage.getAllSessionDates();
    setSessionDates(localDates);
    
    async function fetchBackendSessions() {
      if (isAuthenticated) {
        try {
          const backendSessions = await API.get<any[]>('/sessions');
          setSessions(backendSessions);
          const backendDates = backendSessions.map(s => s.session_date);
          setSessionDates(prev => [...new Set([...prev, ...backendDates])]);
        } catch (e) {
          console.error('Failed to fetch backend sessions:', e);
        }
      }
    }
    fetchBackendSessions();
  }, [isAuthenticated]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Padding for start of week (Sunday start)
    const firstDay = date.getDay();
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    
    return days;
  }, [currentMonth]);

  const monthName = currentMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  function changeMonth(offset: number) {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + offset);
    setCurrentMonth(next);
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-pt-white">
      <DashboardNav />
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-h2 font-display text-pt-black">Productivity Journal</h1>
            <p className="text-sm text-pt-brown mt-1">Review your past missions and progress.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => changeMonth(-1)}
              className="w-10 h-10 rounded-sketch border-2 border-pt-black bg-pt-white hover:bg-pt-cream flex items-center justify-center font-bold"
            >
              ←
            </button>
            <span className="font-display text-lg min-w-[140px] text-center">{monthName}</span>
            <button 
              onClick={() => changeMonth(1)}
              className="w-10 h-10 rounded-sketch border-2 border-pt-black bg-pt-white hover:bg-pt-cream flex items-center justify-center font-bold"
            >
              →
            </button>
          </div>
        </header>

        <div className="grid grid-cols-7 gap-2 mb-12">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
            <div key={d} className="text-center text-xs font-bold uppercase text-pt-brown py-2">
              {d}
            </div>
          ))}
          
          {daysInMonth.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="aspect-square" />;
            
            const dateStr = date.toLocaleDateString('en-CA');
            const hasSession = sessionDates.includes(dateStr);
            const isToday = new Date().toLocaleDateString('en-CA') === dateStr;
            
            return (
              <Link
                key={dateStr}
                href={hasSession ? `/journal/${dateStr}` : '#'}
                className={`
                  aspect-square rounded-sketch border-2 flex flex-col items-center justify-center transition-all
                  ${hasSession 
                    ? 'border-pt-black bg-pt-yellow shadow-sketch hover:-translate-y-1' 
                    : 'border-pt-black/10 bg-pt-cream/30 opacity-40 cursor-default'}
                  ${isToday && !hasSession ? 'ring-2 ring-pt-blue' : ''}
                `}
              >
                <span className="text-sm font-bold">{date.getDate()}</span>
                {hasSession && <div className="mt-1 text-[10px]">🎯 Mission</div>}
              </Link>
            );
          })}
        </div>

        {sessionDates.length === 0 ? (
          <div className="text-center py-20 rounded-sketch border-2 border-dashed border-pt-black/20 bg-pt-cream/10">
            <PTLogo size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-pt-brown font-display text-lg">No missions recorded yet.</p>
            <p className="text-sm text-pt-brown/60 mt-1">Start a new story from the dashboard to fill your journal.</p>
          </div>
        ) : (
          <section className="space-y-4">
            <h2 className="text-h4 font-display mb-4">Mission History</h2>
            <div className="space-y-3">
              {sessionDates.sort((a, b) => b.localeCompare(a)).map(date => (
                <Link 
                  key={date} 
                  href={`/journal/${date}`}
                  className="block p-4 rounded-sketch border-2 border-pt-black bg-white hover:bg-pt-yellow hover:-translate-y-1 transition-all shadow-sketch-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-pt-brown uppercase tracking-widest">{date}</p>
                      <p className="font-display text-lg">Daily Mission</p>
                    </div>
                    <div className="text-2xl">🎯</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
