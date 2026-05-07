'use client';

import { useDroppable }  from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion }        from 'framer-motion';
import { KanbanCard }    from './KanbanCard';
import { cn }            from '@/lib/utils';
import type { Task }     from '@/types/pt.types';

/* ============================================
   KanbanColumn — Droppable column container
   ============================================ */

interface KanbanColumnProps {
  id:          'backlog' | 'inProgress' | 'done';
  title:       string;
  icon:        string;
  tasks:       Task[];
  accentColor: string;
  bgColor:     string;
}

export function KanbanColumn({
  id, title, icon, tasks, accentColor, bgColor,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-h-[300px] rounded-sketch border-2 border-pt-black overflow-hidden',
        'transition-colors duration-150',
      )}
      style={{
        backgroundColor: isOver ? accentColor + '20' : bgColor,
        boxShadow:       '3px 3px 0px #2B2B2B',
        outline:         isOver ? `3px dashed ${accentColor}` : 'none',
        outlineOffset:   '2px',
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b-2 border-pt-black"
        style={{ backgroundColor: accentColor + '30' }}
      >
        <span className="text-lg" aria-hidden="true">{icon}</span>
        <h3
          className="font-bold text-sm"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
        >
          {title}
        </h3>
        <span
          className="ml-auto px-2 py-0.5 rounded-full border-2 border-pt-black text-label font-bold"
          style={{ backgroundColor: accentColor, fontFamily: 'var(--font-body)' }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {tasks.length === 0 ? (
            <motion.div
              animate={isOver ? { scale: 1.02 } : { scale: 1 }}
              className="flex items-center justify-center h-24 rounded border-2 border-dashed border-pt-black/20"
              style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
            >
              <p
                className="text-xs text-center"
                style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
              >
                {isOver ? 'Lepaskan di sini' : 'Drag card ke sini'}
              </p>
            </motion.div>
          ) : (
            tasks.map((task) => (
              <KanbanCard key={task.id} task={task} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
