import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Assignment, Priority, Status } from '../types';
import { Card } from './ui/Card';
import { cn } from '../utils/cn';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface KanbanCardProps {
    assignment: Assignment;
    onClick: () => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ assignment, onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: assignment.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const isCompleted = assignment.status === Status.Completed;

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none mb-3">
            <Card
                className={cn(
                    "p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors group relative overflow-hidden",
                    isDragging && "ring-2 ring-primary ring-offset-2 opacity-50 bg-background/80 backdrop-blur-sm"
                )}
                onClick={onClick}
            >
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded text-xs font-medium border uppercase tracking-wide min-h-[32px]",
                            assignment.priority === Priority.High ? "bg-red-500/5 text-red-600 border-red-200/50" :
                                assignment.priority === Priority.Medium ? "bg-amber-500/5 text-amber-600 border-amber-200/50" :
                                    "bg-zinc-500/5 text-zinc-600 border-zinc-200/50"
                        )}>
                            {assignment.priority}
                        </span>
                        {new Date(assignment.dueDate) < new Date() && !isCompleted && (
                            <span className="text-xs text-destructive font-medium">Overdue</span>
                        )}
                    </div>

                    <h4 className={cn("text-xs font-medium leading-tight", isCompleted && "line-through text-muted-foreground")}>
                        {assignment.title}
                    </h4>

                    <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                        <span>{new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        {isCompleted ? <CheckCircle className="h-3 w-3 text-green-500" /> :
                            assignment.status === Status.InProgress ? <Clock className="h-3 w-3 text-blue-500" /> :
                                <AlertCircle className="h-3 w-3 text-amber-500" />}
                    </div>
                </div>
            </Card>
        </div>
    );
};
