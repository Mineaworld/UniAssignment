import React, { useEffect, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Assignment, Status } from "../types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { createPortal } from "react-dom";

interface KanbanBoardProps {
  assignments: Assignment[];
  onStatusChange: (id: string, newStatus: Status) => Promise<void> | void;
  onCardClick: (assignment: Assignment) => void;
}

const sortAssignments = (items: Assignment[]): Assignment[] =>
  [...items].sort(
    (left, right) =>
      new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime(),
  );

const isStatus = (value: string): value is Status =>
  Object.values(Status).includes(value as Status);

const getStatusForOverId = (overId: string | null): Status | null => {
  if (!overId) return null;
  return isStatus(overId) ? overId : null;
};

export const KanbanBoard = ({
  assignments,
  onStatusChange,
  onCardClick,
}: KanbanBoardProps) => {
  const [boardAssignments, setBoardAssignments] = useState(() =>
    sortAssignments(assignments),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSourceStatus, setActiveSourceStatus] = useState<Status | null>(
    null,
  );
  const [overStatus, setOverStatus] = useState<Status | null>(null);
  const [clicksSuppressed, setClicksSuppressed] = useState(false);
  const dragSnapshotRef = useRef<Assignment[]>(sortAssignments(assignments));
  const clickResetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setBoardAssignments(sortAssignments(assignments));
  }, [assignments]);

  useEffect(
    () => () => {
      if (clickResetTimeoutRef.current) {
        window.clearTimeout(clickResetTimeoutRef.current);
      }
    },
    [],
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 140,
        tolerance: 6,
      },
    }),
  );

  const getColumnItems = (status: Status) =>
    sortAssignments(
      boardAssignments.filter((assignment) => assignment.status === status),
    );

  const resetDragState = () => {
    setActiveId(null);
    setActiveSourceStatus(null);
    setOverStatus(null);
  };

  const applyOptimisticStatus = (id: string, nextStatus: Status) => {
    setBoardAssignments((currentAssignments) =>
      sortAssignments(
        currentAssignments.map((assignment) =>
          assignment.id === id
            ? { ...assignment, status: nextStatus }
            : assignment,
        ),
      ),
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const nextActiveId = event.active.id as string;
    const activeAssignment = boardAssignments.find(
      (assignment) => assignment.id === nextActiveId,
    );

    dragSnapshotRef.current = boardAssignments;
    setActiveId(nextActiveId);
    setActiveSourceStatus(activeAssignment?.status ?? null);
    setOverStatus(activeAssignment?.status ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const nextStatus = getStatusForOverId(event.over?.id?.toString() ?? null);

    if (!nextStatus) return;

    setOverStatus(nextStatus);
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setBoardAssignments(dragSnapshotRef.current);
    resetDragState();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const nextActiveId = event.active.id as string;
    const nextStatus = getStatusForOverId(event.over?.id?.toString() ?? null);
    const originalAssignment = dragSnapshotRef.current.find(
      (assignment) => assignment.id === nextActiveId,
    );

    setClicksSuppressed(true);
    if (clickResetTimeoutRef.current) {
      window.clearTimeout(clickResetTimeoutRef.current);
    }
    clickResetTimeoutRef.current = window.setTimeout(() => {
      setClicksSuppressed(false);
      clickResetTimeoutRef.current = null;
    }, 250);

    resetDragState();

    if (!originalAssignment || !nextStatus) {
      setBoardAssignments(dragSnapshotRef.current);
      return;
    }

    if (nextStatus === originalAssignment.status) {
      setBoardAssignments(sortAssignments(assignments));
      return;
    }

    applyOptimisticStatus(nextActiveId, nextStatus);

    try {
      await onStatusChange(nextActiveId, nextStatus);
    } catch (error) {
      console.error("Failed to persist kanban status change:", error);
      setBoardAssignments(dragSnapshotRef.current);
    }
  };

  const activeAssignment = activeId
    ? boardAssignments.find((assignment) => assignment.id === activeId)
    : null;

  const clickDisabled = Boolean(activeId) || clicksSuppressed;

  return (
    <DndContext
      collisionDetection={(args) => {
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) return pointerCollisions;

        const rectCollisions = rectIntersection(args);
        if (rectCollisions.length > 0) return rectCollisions;

        return closestCenter(args);
      }}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      <div
        data-testid="kanban-board"
        className="flex h-full gap-4 overflow-x-auto pb-4 items-start custom-scrollbar"
      >
        {[Status.Pending, Status.InProgress, Status.Completed].map((status) => (
          <KanbanColumn
            key={status}
            activeSourceStatus={activeSourceStatus}
            clickDisabled={clickDisabled}
            id={status}
            isActiveDropTarget={overStatus === status}
            items={getColumnItems(status)}
            onCardClick={onCardClick}
            showPlaceholder={
              Boolean(activeId) &&
              overStatus === status &&
              activeSourceStatus !== status
            }
          />
        ))}
      </div>

      {createPortal(
        <DragOverlay
          adjustScale={false}
          dropAnimation={{
            duration: 220,
            easing: "cubic-bezier(0.18, 0.67, 0.36, 1)",
          }}
        >
          {activeAssignment ? (
            <div className="w-80 rotate-[1.5deg] opacity-95">
              <KanbanCard
                assignment={activeAssignment}
                clickDisabled
                dragOverlay
                onClick={() => undefined}
              />
            </div>
          ) : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
};
