import React, { useState } from 'react';
import { useApp } from '../context';
import { Priority, Status, Assignment } from '../types';
import { getPriorityColor, getStatusColor } from '../utils/theme';
import { motion, AnimatePresence } from 'framer-motion';
import CreateAssignmentModal from '../components/CreateAssignmentModal';
import EditAssignmentModal from '../components/EditAssignmentModal';
import ViewAssignmentModal from '../components/ViewAssignmentModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const Assignments = () => {
  const { assignments, subjects, updateAssignment, deleteAssignment } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('DueDate');

  const getSubject = (id: string) => subjects.find(s => s.id === id);

  const toggleSubjectFilter = (id: string) => {
    setFilterSubject(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filtered = assignments.filter(a => {
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

  return (
    <div className="flex h-[calc(100vh-theme(spacing.0))] overflow-hidden">
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

      {/* Sidebar Filters */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-[#101622] border-r border-gray-200 dark:border-white/10 overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Filter By</h3>

          <div className="space-y-6">
            {/* Subject Filter */}
            <div className="border-t border-gray-200 dark:border-white/10 pt-4">
              <p className="font-medium text-slate-900 dark:text-white mb-3">Subject</p>
              <div className="space-y-2">
                {subjects.map(s => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary dark:bg-slate-800 dark:border-gray-700"
                      checked={filterSubject.includes(s.id)}
                      onChange={() => toggleSubjectFilter(s.id)}
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-300">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="border-t border-gray-200 dark:border-white/10 pt-4">
              <p className="font-medium text-slate-900 dark:text-white mb-3">Priority</p>
              <div className="space-y-2">
                {[Priority.High, Priority.Medium, Priority.Low].map(p => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      className="border-gray-300 text-primary focus:ring-primary dark:bg-slate-800 dark:border-gray-700"
                      checked={filterPriority === p}
                      onChange={() => setFilterPriority(p)}
                      onClick={() => filterPriority === p && setFilterPriority(null)} // toggle off
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-300">{p}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="border-t border-gray-200 dark:border-white/10 pt-4">
              <p className="font-medium text-slate-900 dark:text-white mb-3">Status</p>
              <div className="space-y-2">
                {[Status.Pending, Status.InProgress, Status.Completed].map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      className="border-gray-300 text-primary focus:ring-primary dark:bg-slate-800 dark:border-gray-700"
                      checked={filterStatus === s}
                      onChange={() => setFilterStatus(s)}
                      onClick={() => filterStatus === s && setFilterStatus(null)}
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-300">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setFilterSubject([]);
                setFilterPriority(null);
                setFilterStatus(null);
              }}
              className="w-full py-2 bg-gray-100 dark:bg-white/5 text-slate-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-sm font-semibold"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">All Assignments</h1>
              <p className="text-slate-500 dark:text-white/60 mt-1">Manage all your course assignments in one place.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Add New Assignment
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex-1 min-w-[300px] relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Search by title..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-white/5 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10">
              <span className="text-sm text-slate-500 dark:text-white/60">Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white font-semibold text-sm cursor-pointer"
              >
                <option value="DueDate">Due Date</option>
                <option value="Priority">Priority</option>
                <option value="Title">Title</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map(assignment => {
                const subject = getSubject(assignment.subjectId);
                const isCompleted = assignment.status === Status.Completed;

                return (
                  <motion.div
                    key={assignment.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setViewingAssignment(assignment)}
                    className="flex flex-col justify-between bg-white dark:bg-[#101622]/50 border border-gray-200 dark:border-white/10 rounded-xl p-6 hover:shadow-xl dark:hover:shadow-primary/5 transition-all duration-300 group relative cursor-pointer"
                  >
                    {/* Reminder Badge */}
                    {assignment.reminder?.enabled && !assignment.reminder.sentAt && (
                      <div className="absolute top-4 left-4" title="Reminder set">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30">
                          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[18px]">
                            notifications
                          </span>
                        </span>
                      </div>
                    )}

                    <div className="absolute top-4 right-4 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAssignment(assignment);
                        }}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit Assignment"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingAssignment(assignment);
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Assignment"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>

                    <div className="space-y-4 pr-8">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight line-clamp-2">{assignment.title}</h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 ${getPriorityColor(assignment.priority)}`}>
                          <span className="material-symbols-outlined text-sm">priority_high</span>
                          {assignment.priority}
                        </span>
                        {subject && (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${subject.color} bg-opacity-10 text-opacity-90`}>
                            {subject.name}
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(assignment.status)}`}>
                          {assignment.status}
                        </span>
                        {assignment.examType === 'midterm' && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                            Midterm
                          </span>
                        )}
                        {assignment.examType === 'final' && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                            Final
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                        <span className="material-symbols-outlined text-lg">event</span>
                        <span className="font-medium">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-end gap-3">
                      {!isCompleted ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAssignment(assignment.id, { status: Status.Completed });
                          }}
                          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Mark Complete
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAssignment(assignment.id, { status: Status.InProgress });
                          }}
                          className="px-4 py-2 bg-green-600/10 text-green-600 dark:text-green-400 text-sm font-bold rounded-lg cursor-pointer hover:bg-green-600/20 transition-colors"
                        >
                          Completed
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">search_off</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Assignments Found</h3>
                <p className="text-slate-500 dark:text-white/60 mt-2">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Assignments;