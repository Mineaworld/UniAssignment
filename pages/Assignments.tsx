import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { Priority, Status, Assignment } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import CreateAssignmentModal from '../components/CreateAssignmentModal';
import EditAssignmentModal from '../components/EditAssignmentModal';
import ViewAssignmentModal from '../components/ViewAssignmentModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { NeonButton } from '../components/ui/NeonButton';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { Search, Plus, Filter, X, CheckCircle, Clock, AlertCircle, Trash2, Edit, LayoutGrid, List as ListIcon, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';
import { KanbanBoard } from '../components/KanbanBoard';
import { AssignmentMobileCard } from '../components/AssignmentMobileCard';
import { ScrollIndicator } from '../components/ScrollIndicator';
import { AnimatedThemeToggler } from '../components/ui/AnimatedThemeToggler';
import { SubjectBadge } from '../components/ui/SubjectBadge';
import { SharedAssignmentBadge } from '../components/ui/SharedAssignmentBadge';
import { SharedPermissionBadge } from '../components/ui/SharedPermissionBadge';
import { AssignmentStatusSelect } from '../components/AssignmentStatusSelect';
import { getAssignmentSubject } from '../utils/assignmentSubject';

type AssignmentScopeFilter = 'all' | 'personal' | 'shared';

interface JoinedAssignmentLocationState {
  joinedSharedSpaceId?: string;
  joinedSharedTargetType?: 'subject' | 'assignment';
}

const Assignments = () => {
  const { assignments, subjects, updateAssignment, deleteAssignment } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusUpdatingIds, setStatusUpdatingIds] = useState<Set<string>>(() => new Set());
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  // Filters State
  const [filterSubject, setFilterSubject] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | null>(null);
  const [filterScope, setFilterScope] = useState<AssignmentScopeFilter>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('DueDate');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const toggleSubjectFilter = (id: string) => {
    setFilterSubject(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Derived State
  const filtered = useMemo(() => {
    return assignments.filter(a => {
      if (filterScope === 'personal' && a.isShared) return false;
      if (filterScope === 'shared' && !a.isShared) return false;
      if (filterSubject.length > 0 && !filterSubject.includes(a.subjectId)) return false;
      if (filterPriority && a.priority !== filterPriority) return false;
      if (filterStatus && a.status !== filterStatus) return false;
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'DueDate') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sortBy === 'Priority') {
        const pMap = { [Priority.High]: 3, [Priority.Medium]: 2, [Priority.Low]: 1 };
        return pMap[b.priority] - pMap[a.priority];
      }
      if (sortBy === 'Title') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [assignments, filterPriority, filterScope, filterStatus, filterSubject, search, sortBy]);

  const activeFilterCount = filterSubject.length + (filterPriority ? 1 : 0) + (filterStatus ? 1 : 0) + (filterScope === 'all' ? 0 : 1);

  useEffect(() => {
    const joinedState = location.state as JoinedAssignmentLocationState | null;

    if (joinedState?.joinedSharedTargetType !== 'assignment' || !joinedState.joinedSharedSpaceId) {
      return;
    }

    const joinedAssignment = assignments.find((assignment) => (
      assignment.sharedSpaceId === joinedState.joinedSharedSpaceId &&
      assignment.sharedTargetType === 'assignment'
    ));

    if (!joinedAssignment) {
      return;
    }

    setViewingAssignment(joinedAssignment);
    navigate(location.pathname, { replace: true, state: null });
  }, [assignments, location.pathname, location.state, navigate]);

  const handleDeleteAssignment = async () => {
    if (!deletingAssignment) return;
    setDeleteLoading(true);
    try {
      await deleteAssignment(deletingAssignment.id);
      setDeletingAssignment(null);
    } catch (error) {
      console.error("Failed to delete assignment:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Status) => {
    setStatusUpdatingIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(id);
      return nextIds;
    });
    try {
      await updateAssignment(id, { status: newStatus });
    } catch (error) {
      console.error("Failed to update status", error);
    } finally {
      setStatusUpdatingIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(id);
        return nextIds;
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.0))] max-w-[1600px] mx-auto w-full p-6 md:p-8 space-y-6">
      <CreateAssignmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditAssignmentModal isOpen={!!editingAssignment} onClose={() => setEditingAssignment(null)} assignment={editingAssignment} />
      <ViewAssignmentModal isOpen={!!viewingAssignment} onClose={() => setViewingAssignment(null)} assignment={viewingAssignment} />
      <ConfirmDeleteModal
        isOpen={!!deletingAssignment}
        onClose={() => setDeletingAssignment(null)}
        onConfirm={handleDeleteAssignment}
        title="Delete Assignment"
        itemName={deletingAssignment?.title || ''}
        itemType="assignment"
        loading={deleteLoading}
      />

      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 md:pt-0">
        <div className="flex items-start justify-between w-full md:w-auto">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60">Assignments</h1>
            <p className="text-muted-foreground text-sm mt-1">Track and manage your academic tasks.</p>
          </div>
          <AnimatedThemeToggler className="md:hidden h-10 w-10 bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 rounded-xl shrink-0" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* View Toggle */}
          <div className="flex items-center bg-muted/30 p-1 rounded-xl border border-border backdrop-blur-sm dark:bg-black/20 dark:border-white/10">
            <button
              data-testid="assignments-list-view-button"
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white/60 dark:bg-white/10 text-foreground dark:text-white shadow-sm" : "text-muted-foreground hover:text-foreground dark:hover:text-white")}
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              data-testid="assignments-board-view-button"
              aria-label="Board view"
              aria-pressed={viewMode === 'board'}
              onClick={() => setViewMode('board')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'board' ? "bg-white/60 dark:bg-white/10 text-foreground dark:text-white shadow-sm" : "text-muted-foreground hover:text-foreground dark:hover:text-white")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              inputMode="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 glass-surface focus:border-primary/50 focus:bg-white/60 dark:focus:bg-black/40 transition-all rounded-xl"
            />
          </div>
          <NeonButton data-testid="add-assignment-button" onClick={() => setIsModalOpen(true)} className="gap-2" variant="primary" glow>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Task</span>
            <span className="sm:hidden">Add</span>
          </NeonButton>
        </div>
      </div>

      {/* Filter Island with Scroll Indicators */}
      <GlassCard className="rounded-2xl -mx-2 px-4 py-3">
        <ScrollIndicator className="flex flex-wrap items-center gap-x-2 gap-y-2.5 pb-2">
          <button
            type="button"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            aria-expanded={isFiltersOpen}
            className="flex items-center justify-between md:justify-start gap-1.5 pr-4 md:border-r border-border md:mr-2 text-muted-foreground cursor-pointer w-full md:w-auto"
          >
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wider">Filters</span>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              {!isFiltersOpen && activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={cn("h-3 w-3 transition-transform duration-300", isFiltersOpen && "rotate-180")} />
            </div>
          </button>

          <div className={cn(
            "flex flex-wrap items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out w-full md:w-auto",
            isFiltersOpen ? "max-h-[500px] opacity-100 mt-2 md:mt-0" : "max-h-0 opacity-0 md:max-h-none md:opacity-100 mt-0",
            "md:contents"
          )}>
          {(['all', 'personal', 'shared'] as const).map((scope) => (
            <NeonButton
              key={scope}
              variant={filterScope === scope ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilterScope(scope)}
              className={cn(
                "h-8 text-xs font-medium border transition-colors",
                filterScope !== scope && "border-border bg-muted/30 hover:bg-muted/50 text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              )}
              glow={filterScope === scope}
            >
              {scope === 'all' ? 'All' : scope === 'personal' ? 'Personal' : 'Shared'}
            </NeonButton>
          ))}

          <div className="w-px h-6 bg-border mx-1" />

          {/* Status Chips */}
          {[Status.Pending, Status.InProgress, Status.Completed].map((s) => (
            <NeonButton
              key={s}
              variant={filterStatus === s ? "primary" : "ghost"}
              size="sm"
              onClick={() => setFilterStatus(filterStatus === s ? null : s)}
              className={cn(
                "h-8 text-xs font-medium border transition-colors",
                filterStatus !== s && "border-border bg-muted/30 hover:bg-muted/50 text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              )}
              glow={filterStatus === s}
            >
              {s === Status.Completed ? <CheckCircle className="h-3 w-3 mr-1" /> :
                s === Status.InProgress ? <Clock className="h-3 w-3 mr-1" /> :
                  <AlertCircle className="h-3 w-3 mr-1" />}
              {s}
            </NeonButton>
          ))}

          <div className="w-px h-6 bg-border mx-1" />

          {/* Priority Chips */}
          {[Priority.High, Priority.Medium, Priority.Low].map((p) => (
            <NeonButton
              key={p}
              variant={filterPriority === p ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilterPriority(filterPriority === p ? null : p)}
              className={cn(
                "h-8 text-xs font-medium border transition-colors",
                filterPriority !== p && "border-border bg-muted/30 hover:bg-muted/50 text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              )}
              glow={filterPriority === p}
            >
              {p} Priority
            </NeonButton>
          ))}

          <div className="w-px h-6 bg-border mx-1" />

          {/* Subject Chips (Scrollable if many) */}
          {subjects.map((s) => (
            <NeonButton
              key={s.id}
              variant="ghost"
              size="sm"
              onClick={() => toggleSubjectFilter(s.id)}
              className={cn(
                "h-8 text-xs font-medium border transition-colors whitespace-nowrap",
                filterSubject.includes(s.id)
                  ? "bg-primary/10 text-foreground border-primary/30 dark:bg-white/20 dark:text-white dark:border-white/30"
                  : "border-border bg-muted/30 hover:bg-muted/50 text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              )}
            >
              <SubjectBadge
                className={cn(
                  'border-none bg-transparent px-0 py-0 shadow-none dark:bg-transparent',
                  filterSubject.includes(s.id) && 'text-foreground dark:text-white'
                )}
                initialsClassName="h-6 min-w-6 px-1.5 text-[10px]"
                name={s.name}
                size="sm"
              />
            </NeonButton>
          ))}

          {activeFilterCount > 0 && (
            <NeonButton
              variant="ghost"
              size="sm"
              onClick={() => { setFilterSubject([]); setFilterPriority(null); setFilterStatus(null); setFilterScope('all'); }}
              className="ml-auto h-7 px-2 text-xs hover:text-destructive text-muted-foreground"
            >
              <X className="h-3 w-3 mr-1" /> Clear
            </NeonButton>
          )}
          </div>
        </ScrollIndicator>
      </GlassCard>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        {viewMode === 'list' ? (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 overflow-y-auto h-full custom-scrollbar px-1 pb-20">
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.map((assignment, index) => {
                  const subject = getAssignmentSubject(assignment, subjects);
                  return (
                    <AssignmentMobileCard
                      key={assignment.id}
                      assignment={assignment}
                      onStatusChange={(nextStatus) => handleStatusChange(assignment.id, nextStatus)}
                      subject={subject}
                      statusUpdating={statusUpdatingIds.has(assignment.id)}
                      onClick={() => setViewingAssignment(assignment)}
                      onEdit={() => setEditingAssignment(assignment)}
                      onDelete={() => setDeletingAssignment(assignment)}
                      index={index}
                    />
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <p className="text-sm">No assignments found</p>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <GlassCard className="hidden md:flex rounded-xl shadow-sm overflow-y-auto h-full flex-col p-1">
              <Table>
                <TableHeader className="bg-muted/30 dark:bg-white/5">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="w-[140px] text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Title</TableHead>
                    <TableHead className="text-muted-foreground">Subject</TableHead>
                    <TableHead className="text-muted-foreground">Priority</TableHead>
                    <TableHead className="text-muted-foreground">Due Date</TableHead>
                    <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filtered.map((assignment) => {
                      const subject = getAssignmentSubject(assignment, subjects);
                      const isCompleted = assignment.status === Status.Completed;
                      return (
                        <motion.tr
                          data-testid={`assignment-row-${assignment.id}`}
                          key={assignment.id}
                          layout
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            "border-b border-border dark:border-white/5 transition-colors hover:bg-muted/30 dark:hover:bg-white/5 group cursor-pointer",
                            isCompleted && "opacity-60 hover:opacity-100"
                          )}
                          onClick={() => setViewingAssignment(assignment)}
                        >
                          <TableCell>
                            <AssignmentStatusSelect
                              disabled={statusUpdatingIds.has(assignment.id)}
                              onChange={(nextStatus) => handleStatusChange(assignment.id, nextStatus)}
                              status={assignment.status}
                              testId={`assignment-status-select-inline-${assignment.id}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-sm text-foreground">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={cn(isCompleted && "line-through text-muted-foreground")}>{assignment.title}</span>
                              {assignment.isShared && (
                                <SharedAssignmentBadge compact />
                              )}
                              {assignment.isShared && (
                                <SharedPermissionBadge role={assignment.sharedRole} />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {subject && (
                              <SubjectBadge name={subject.name} size="sm" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className={cn("h-2 w-2 rounded-full",
                                assignment.priority === Priority.High ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                                  assignment.priority === Priority.Medium ? "bg-amber-500" : "bg-slate-400"
                              )} />
                              <span className="text-xs text-muted-foreground">{assignment.priority}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={cn("text-sm",
                              new Date(assignment.dueDate) < new Date() && !isCompleted ? "text-destructive font-bold" : "text-muted-foreground"
                            )}>
                              {new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button data-testid={`assignment-edit-${assignment.id}`} aria-label={`Edit assignment ${assignment.title}`} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-white/10"
                                onClick={(e) => { e.stopPropagation(); setEditingAssignment(assignment); }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {assignment.canDelete && (
                                <Button data-testid={`assignment-delete-${assignment.id}`} aria-label={`Delete assignment ${assignment.title}`} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={(e) => { e.stopPropagation(); setDeletingAssignment(assignment); }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </GlassCard>
          </>
        ) : (
          <KanbanBoard
            assignments={filtered}
            onStatusChange={handleStatusChange}
            onCardClick={(assignment) => setViewingAssignment(assignment)}
          />
        )}
      </div>
    </div>
  );
};

export default Assignments;
