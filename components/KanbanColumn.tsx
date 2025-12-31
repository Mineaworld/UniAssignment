import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Status, Assignment } from '../types';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { cn } from '../utils/cn';

interface KanbanColumnProps {
    id: Status;
    items: Assignment[];
    onCardClick: (assignment: Assignment) => void;
}

export const KanbanColumn = ({ id, items, onCardClick }: KanbanColumnProps) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col h-full w-80 shrink-0">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full",
                        id === Status.Pending ? "bg-amber-500" :
                            id === Status.InProgress ? "bg-blue-500" : "bg-green-500"
                    )} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{id}</span>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
            </div>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className="flex-1 rounded-xl bg-muted/20 border border-border/40 p-2 overflow-y-auto custom-scrollbar min-h-[150px]"
            >
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map((assignment) => (
                        <KanbanCard key={assignment.id} assignment={assignment} onClick={() => onCardClick(assignment)} />
                    ))}
                </SortableContext>
                {items.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground/50 italic">
                        No tasks
                    </div>
                )}
            </div>
        </div>
    );
};
