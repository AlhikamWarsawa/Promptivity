'use client';

import { useState, useMemo }          from 'react';
import {
  DndContext, DragEndEvent, DragOverlay,
  DragStartEvent, PointerSensor, useSensor, useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { KanbanColumn }               from './KanbanColumn';
import { KanbanCardOverlay }          from './KanbanCard';
import { FrameworkEmptyState }        from '@/components/frameworks/FrameworkPageLayout';
import { useFramework, usePTStore }   from '@/store/usePTStore';
import type { Task }                  from '@/types/pt.types';

/* ============================================
   KanbanView — Interactive Kanban board
   
   Features:
   - 3 columns: Backlog, In Progress, Done
   - Drag cards between columns via @dnd-kit
   - Drag overlay with rotation
   - Drop zone highlighting
   - Card state persists to localStorage
   ============================================ */

const COLUMNS = [
  { id: 'backlog'    as const, title: 'Backlog',     icon: '📋', accentColor: '#35D5F4', bgColor: '#F3F3F1' },
  { id: 'inProgress' as const, title: 'In Progress', icon: '⚡', accentColor: '#F28C28', bgColor: '#FEF0E0' },
  { id: 'done'       as const, title: 'Done',        icon: '✅', accentColor: '#17B66A', bgColor: '#E0F8EE' },
];

export function KanbanView() {
  const fwData        = useFramework('kanban');
  const moveKanbanCard = usePTStore((s) => s.moveKanbanCard);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },   // Prevent accidental drag on click
    }),
  );

  const rawData = useMemo(() => {
    if (!fwData?.rawData) return null;
    return fwData.rawData as {
      backlog:    Task[];
      inProgress: Task[];
      done:       Task[];
    };
  }, [fwData]);

  if (!fwData || !rawData) {
    return <FrameworkEmptyState frameworkId="kanban" />;
  }

  function handleDragStart(event: DragStartEvent) {
    const allTasks = [
      ...(rawData?.backlog ?? []),
      ...(rawData?.inProgress ?? []),
      ...(rawData?.done ?? []),
    ];
    const task = allTasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    // Tentukan target column
    const targetColumn = (
      ['backlog', 'inProgress', 'done'].includes(overId)
        ? overId
        : getColumnOfTask(overId, rawData!)
    ) as 'backlog' | 'inProgress' | 'done' | null;

    if (!targetColumn) return;
    moveKanbanCard(String(active.id), targetColumn);
  }

  return (
    <div>
      {/* Info bar */}
      <div
        className="mb-4 p-3 rounded-sketch border-2 border-pt-black text-sm"
        style={{ backgroundColor: '#35D5F4' + '15', fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
      >
        💡 <strong>Drag card</strong> antar kolom untuk memperbarui status tugasmu.
        Card di <em>Done</em> otomatis ditandai selesai.
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-row overflow-x-auto sm:grid sm:grid-cols-3 gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {COLUMNS.map((col) => (
            <div key={col.id} className="min-w-[280px] sm:min-w-0 flex-1">
              <KanbanColumn
                id={col.id}
                title={col.title}
                icon={col.icon}
                tasks={rawData[col.id] ?? []}
                accentColor={col.accentColor}
                bgColor={col.bgColor}
              />
            </div>
          ))}
        </div>

        {/* Drag overlay — shown while dragging */}
        <DragOverlay
          dropAnimation={{
            duration: 250,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {activeTask ? <KanbanCardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Stats */}
      <div className="mt-6 flex gap-4 flex-wrap">
        {COLUMNS.map((col) => (
          <div key={col.id} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border border-pt-black/30"
              style={{ backgroundColor: col.accentColor }} />
            <span className="text-xs" style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}>
              {col.title}: {(rawData[col.id] ?? []).length}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getColumnOfTask(
  taskId: string,
  rawData: { backlog: Task[]; inProgress: Task[]; done: Task[] },
): 'backlog' | 'inProgress' | 'done' | null {
  if (rawData.backlog?.some((t) => t.id === taskId)) return 'backlog';
  if (rawData.inProgress?.some((t) => t.id === taskId)) return 'inProgress';
  if (rawData.done?.some((t) => t.id === taskId)) return 'done';
  return null;
}
