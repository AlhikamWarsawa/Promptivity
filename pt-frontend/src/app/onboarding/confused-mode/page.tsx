'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePTStore } from '@/store/usePTStore';
import { PTButton } from '@/components/pt/PTButton';
import { PTTextarea } from '@/components/pt/PTTextarea';
import { MotiMascot } from '@/components/pt/icons';
import { OnboardingTopBar } from '@/components/pt/OnboardingTopBar';
import { ProcessingOverlay } from '@/components/pt/ProcessingOverlay';
import { PT_PROCESSING_MESSAGES } from '@/components/pt/ProcessingOverlay';
import { apiFetch } from '@/lib/api';

/* ============================================
   /onboarding/confused-mode
   
   Chat interface for Confused Mode.
   Moti helps the user untangle their thoughts.
   ============================================ */

export default function ConfusedModePage() {
  const router = useRouter();
  
  const confusedMessages = usePTStore((s) => s.confusedMessages);
  const addConfusedMessage = usePTStore((s) => s.addConfusedMessage);
  const addGreetingMessage = usePTStore((s) => s.addGreetingMessage);
  const resetConfusedMessages = usePTStore((s) => s.resetConfusedMessages);
  const loadFromStorage = usePTStore((s) => s.loadFromStorage);
  const processStory = usePTStore((s) => s.processStory);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [confusedMessages, isTyping]);

  // Load from storage and initial greeting if empty
  useEffect(() => {
    loadFromStorage();
    addGreetingMessage();
  }, [loadFromStorage, addGreetingMessage]);

  async function handleSend() {
    if (!input.trim() || isTyping) return;
    
    const userMsg = input.trim();
    setInput('');
    addConfusedMessage('user', userMsg);
    setIsTyping(true);
    setErrorMsg(null);

    try {
      // Send to backend
      const res = await apiFetch('/api/confused-chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userMsg,
          history: confusedMessages, // send existing context
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Moti returned a non-JSON response (Server Error)');
      }

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal mengirim pesan');

      addConfusedMessage('model', data.reply);
    } catch (err: any) {
      setErrorMsg(err.message || 'Moti sedang gangguan sinyal. Coba lagi ya!');
      setInput(userMsg); // restore input
    } finally {
      setIsTyping(false);
    }
  }

  async function handleFinishSession() {
    if (confusedMessages.length < 3) {
      alert('Ngobrol sebentar lagi yuk supaya Moti bisa paham kondisimu!');
      return;
    }
    
    setIsFinishing(true);
    
    try {
      // Generate summary story from chat
      const res = await apiFetch('/api/finish-confused-session', {
        method: 'POST',
        body: JSON.stringify({
          history: confusedMessages,
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Moti returned a non-JSON response (Server Error)');
      }

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal membuat ringkasan');

      const story = data.story;
      
      // Clear confused chat history now that we have the story
      resetConfusedMessages();
      
      // Now process the generated story to build dashboard
      const processRes = await processStory(story);
      if (!processRes.success) throw new Error(processRes.error);
      
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat memproses sesi.');
      setIsFinishing(false);
    }
  }

  return (
    <main
      className="h-screen flex flex-col relative"
      style={{ backgroundColor: 'var(--pt-cream)' }}
    >
      <OnboardingTopBar currentStep={4} />

      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b-2 border-pt-black bg-white"
        style={{ boxShadow: '0 2px 0px #2B2B2B' }}
      >
        <div className="w-10 h-10 rounded-full border-2 border-pt-black bg-pt-yellow flex items-center justify-center overflow-hidden shrink-0">
          <MotiMascot size={28} />
        </div>
        <div>
          <h2 className="font-display text-lg text-pt-black leading-tight">Moti</h2>
          <p className="text-xs font-body text-pt-green font-bold">Online</p>
        </div>
        
        <div className="ml-auto">
          <PTButton
            variant="outline"
            size="sm"
            onClick={handleFinishSession}
            disabled={isFinishing || confusedMessages.length < 3}
            title={confusedMessages.length < 3 ? 'Ngobrol dulu ya!' : 'Selesai & Buat Mission'}
          >
            Selesai Ngobrol ✨
          </PTButton>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-24">
        {confusedMessages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}
        
        {isTyping && (
          <div className="flex gap-2 items-center self-start bg-white border-2 border-pt-black rounded-2xl rounded-tl-sm px-4 py-3 shadow-sketch-sm">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 bg-pt-black rounded-full" />
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-pt-black rounded-full" />
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-pt-black rounded-full" />
          </div>
        )}
        
        {errorMsg && (
          <div className="text-center text-sm text-pt-coral font-bold p-2 bg-red-50 rounded-sketch border border-pt-coral mx-4">
            {errorMsg}
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div
        className="absolute bottom-0 left-0 right-0 p-4 bg-pt-cream border-t-2 border-pt-black"
        style={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}
      >
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <div className="flex-1">
            <PTTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik balasanmu di sini..."
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          <PTButton
            variant="primary"
            size="md"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="mb-1 shrink-0"
          >
            Kirim 🚀
          </PTButton>
        </div>
        <p className="text-center text-[10px] text-gray-500 mt-2 font-body max-w-xl mx-auto">
          Moti menggunakan AI untuk membantu mengurai pikiranmu. Ngobrol sesukamu sampai merasa lebih lega.
        </p>
      </div>

      {/* Overlay when finishing */}
      <ProcessingOverlay
        isVisible={isFinishing}
        messages={[
          { text: 'Meringkas obrolan kita...', icon: '📝', durationMs: 2500 },
          { text: 'Mengurai benang kusut...', icon: '🧶', durationMs: 2500 },
          ...PT_PROCESSING_MESSAGES.slice(1) // reuse standard ones
        ]}
      />
    </main>
  );
}

function ChatBubble({ role, content }: { role: 'user' | 'model', content: string }) {
  const isModel = role === 'model';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex max-w-[85%] ${isModel ? 'self-start' : 'self-end'}`}
    >
      <div
        className={`px-4 py-3 rounded-2xl border-2 border-pt-black shadow-sketch-sm ${
          isModel 
            ? 'bg-white rounded-tl-sm' 
            : 'bg-pt-blue text-white rounded-tr-sm border-white'
        }`}
        style={{
          boxShadow: isModel ? '2px 2px 0px #2B2B2B' : '2px 2px 0px rgba(0,0,0,0.2)',
        }}
      >
        <p
          className="whitespace-pre-wrap leading-relaxed"
          style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem' }}
        >
          {content}
        </p>
      </div>
    </motion.div>
  );
}
