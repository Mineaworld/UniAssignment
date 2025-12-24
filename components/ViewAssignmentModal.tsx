import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Priority, Status, Assignment } from '../types';
import { useApp } from '../context';
import { getPriorityColor, getStatusColor } from '../utils/theme';
import { formatReminderText } from '../utils/reminder';

interface ViewAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: Assignment | null;
}

const ViewAssignmentModal: React.FC<ViewAssignmentModalProps> = ({ isOpen, onClose, assignment }) => {
    const { subjects } = useApp();

    if (!assignment) return null;

    const subject = subjects.find(s => s.id === assignment.subjectId);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-[#101622] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                            <h2 id="modal-title" className="text-xl font-bold text-slate-900 dark:text-white">Assignment Details</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/60 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">

                            {/* Title & Subject */}
                            <div>
                                <div className="flex items-start justify-between gap-4">
                                    <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                        {assignment.title}
                                    </h1>
                                    {subject && (
                                        <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${subject.color} bg-opacity-10 text-opacity-90 whitespace-nowrap`}>
                                            {subject.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Meta Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Status */}
                                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block mb-2">Status</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(assignment.status)}`}>
                                            {assignment.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Priority */}
                                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block mb-2">Priority</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${getPriorityColor(assignment.priority)}`}>
                                            <span className="material-symbols-outlined text-[18px]">priority_high</span>
                                            {assignment.priority}
                                        </span>
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block mb-2">Due Date</span>
                                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                                        <span className="material-symbols-outlined text-primary">event</span>
                                        {new Date(assignment.dueDate).toLocaleDateString(undefined, {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>

                                {/* Due Time */}
                                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block mb-2">Time</span>
                                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                                        <span className="material-symbols-outlined text-primary">schedule</span>
                                        {new Date(assignment.dueDate).toLocaleTimeString(undefined, {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Reminder */}
                            {assignment.reminder?.enabled && (
                                <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 border border-amber-100 dark:border-amber-500/30">
                                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300 block mb-2">Reminder</span>
                                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-semibold text-sm">
                                        <span className="material-symbols-outlined text-amber-500 text-[18px]">notifications</span>
                                        <span>{formatReminderText(assignment.dueDate, assignment.reminder)}</span>
                                    </div>
                                    {assignment.reminder.sentAt && (
                                        <span className="text-xs text-amber-600 dark:text-amber-400 mt-1 block">
                                            Sent on {new Date(assignment.reminder.sentAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Exam Type Tag if exists */}
                            {assignment.examType && (
                                <div>
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block mb-2">Type</span>
                                    {assignment.examType === 'midterm' ? (
                                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                                            <span className="material-symbols-outlined text-[18px]">school</span>
                                            Midterm Exam
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                                            <span className="material-symbols-outlined text-[18px]">school</span>
                                            Final Exam
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Description */}
                            {assignment.description && (
                                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 border border-gray-100 dark:border-white/5">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Description</h3>
                                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        {assignment.description}
                                    </p>
                                </div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-lg text-white bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ViewAssignmentModal;
