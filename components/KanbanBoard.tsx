import React, { useState } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, DragStartEvent, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { Assignment, Status } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { createPortal } from 'react-dom';

interface KanbanBoardProps {
    assignments: Assignment[];
    onStatusChange: (id: string, newStatus: Status) => void;
    onCardClick: (assignment: Assignment) => void;
}

export const KanbanBoard = ({ assignments, onStatusChange, onCardClick }: KanbanBoardProps) => {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Prevent accidental drags
            },
        })
    );

    const pending = assignments.filter(a => a.status === Status.Pending);
    const inProgress = assignments.filter(a => a.status === Status.InProgress);
    const completed = assignments.filter(a => a.status === Status.Completed);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string; // This will be the Status

        const assignment = assignments.find(a => a.id === activeId);
        if (!assignment) return;

        // Determine the new status
        // If dropped on a column, overId is the status
        // If dropped on a card, we need to find that card's column (logic simplified here by assuming columns are drop zones)
        // Actually, KanbanColumn uses droppable id = Status. 
        // BUT SortableContext items are also droppable. 
        // dnd-kit logic: if dropped on card, need to find that card's status.

        let newStatus: Status | undefined;

        if (Object.values(Status).includes(overId as Status)) {
            newStatus = overId as Status;
        } else {
            // Dropped on another card
            const overCard = assignments.find(a => a.id === overId);
            if (overCard) {
                newStatus = overCard.status;
            }
        }

        if (newStatus && newStatus !== assignment.status) {
            onStatusChange(activeId, newStatus);
        }
    };

    const activeAssignment = activeId ? assignments.find(a => a.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full gap-4 overflow-x-auto pb-4 items-start">
                <KanbanColumn id={Status.Pending} items={pending} onCardClick={onCardClick} />
                <KanbanColumn id={Status.InProgress} items={inProgress} onCardClick={onCardClick} />
                <KanbanColumn id={Status.Completed} items={completed} onCardClick={onCardClick} />
            </div>

            {createPortal(
                <DragOverlay>
                    {activeAssignment ? (
                        <div className="w-80 opacity-90 rotate-2 cursor-grabbing">
                            <KanbanCard assignment={activeAssignment} onClick={() => { }} />
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
};
