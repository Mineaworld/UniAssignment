import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Share2 } from 'lucide-react';
import { Priority, Status, Assignment } from '../types';
import { useApp } from '../context';
import { getPriorityColor, getStatusColor } from '../utils/theme';
import { formatReminderText } from '../utils/reminder';
import { getNotesContent } from '../utils/migrateNotes';
import { NotesViewer, NotesFullscreenModal } from './notes';
import ShareManagerModal from './ShareManagerModal';
import { SubjectBadge } from './ui/SubjectBadge';
import { Button } from './ui/Button';
import { SharedAssignmentBadge } from './ui/SharedAssignmentBadge';
import { SharedPermissionBadge } from './ui/SharedPermissionBadge';
import { getAssignmentSubject } from '../utils/assignmentSubject';

interface ViewAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: Assignment | null;
}

const ViewAssignmentModal = ({ isOpen, onClose, assignment }: ViewAssignmentModalProps) => {
    const { assignments, subjects, updateAssignment, uploadNoteImage } = useApp();
    const [isNotesFullscreen, setIsNotesFullscreen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    if (!assignment) return null;

    const liveAssignment = assignments.find((item) => (
        item.id === assignment.id || item.sharedAssignmentId === assignment.id
    )) ?? assignment;
    const subject = getAssignmentSubject(liveAssignment, subjects);
    const notesContent = getNotesContent(liveAssignment.notes, liveAssignment.description);
    const showShareAction = !liveAssignment.isShared || liveAssignment.canManageShare || liveAssignment.sharedTargetType === 'subject';

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                    />
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="pointer-events-auto relative w-full max-w-2xl bg-background dark:bg-[#101622] rounded-2xl shadow-2xl border border-border/20 overflow-hidden max-h-[90vh] overflow-y-auto"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="modal-title"
                        >
                            {/* Header */}
                            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border/20 bg-background p-4 dark:border-white/10 dark:bg-[#101622] sm:p-6">
                                <div className="min-w-0">
                                    <h2 id="modal-title" className="text-xl font-bold text-foreground">Assignment Details</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    {showShareAction && (
                                        <Button
                                            data-testid="assignment-share-button"
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsShareModalOpen(true)}
                                            aria-label={liveAssignment.isShared ? 'Manage assignment sharing' : 'Share assignment'}
                                            className="h-10 rounded-xl border-border/60 bg-background/80 px-3 shadow-sm hover:bg-muted sm:px-4"
                                        >
                                            <Share2 className="h-4 w-4" />
                                            <span className="ml-2 sm:hidden">
                                                {liveAssignment.isShared ? 'Manage' : 'Share'}
                                            </span>
                                            <span className="ml-2 hidden sm:inline">
                                                {liveAssignment.isShared ? 'Manage share' : 'Share'}
                                            </span>
                                        </Button>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-8 max-h-[80vh] sm:max-h-[85vh] overflow-y-auto custom-scrollbar">

                                {/* Title & Subject */}
                                <div>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-3">
                                            <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                                {liveAssignment.title}
                                            </h1>
                                            {liveAssignment.isShared && (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <SharedAssignmentBadge />
                                                    <SharedPermissionBadge role={liveAssignment.sharedRole} />
                                                </div>
                                            )}
                                        </div>
                                        {subject && (
                                            <SubjectBadge name={subject.name} size="sm" />
                                        )}
                                    </div>
                                </div>

                                {liveAssignment.isShared && (
                                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="text-sm font-semibold text-foreground">
                                                {liveAssignment.sharedTargetType === 'subject' ? 'Shared through subject' : 'Shared assignment'}
                                            </div>
                                            <SharedPermissionBadge role={liveAssignment.sharedRole} />
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {liveAssignment.sharedTargetType === 'subject'
                                                ? 'Base assignment details sync across members. Your status, reminders, and notes stay personal.'
                                                : 'This assignment is shared directly by link. Personal progress still stays private for each member.'}
                                        </p>
                                        <div className="mt-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                                            {liveAssignment.sharedRole === 'viewer' && (
                                                <span>You can update your own status, reminders, and notes, but shared assignment details stay read-only.</span>
                                            )}
                                            {liveAssignment.sharedRole === 'editor' && (
                                                <span>You can update the shared assignment details for everyone, along with your own status, reminders, and notes.</span>
                                            )}
                                            {liveAssignment.sharedRole === 'owner' && (
                                                <span>You manage the share link, members, and all shared assignment details.</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Meta Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Status */}
                                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block mb-2">Status</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(liveAssignment.status)}`}>
                                                {liveAssignment.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Priority */}
                                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block mb-2">Priority</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${getPriorityColor(liveAssignment.priority)}`}>
                                                <span className="material-symbols-outlined text-[18px]">priority_high</span>
                                                {liveAssignment.priority}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Due Date */}
                                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block mb-2">Due Date</span>
                                        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                                            <span className="material-symbols-outlined text-primary">event</span>
                                            {new Date(liveAssignment.dueDate).toLocaleDateString(undefined, {
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
                                            {new Date(liveAssignment.dueDate).toLocaleTimeString(undefined, {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Reminder */}
                                {liveAssignment.reminder?.enabled && (
                                    <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 border border-amber-100 dark:border-amber-500/30">
                                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300 block mb-2">Reminder</span>
                                        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-semibold text-sm">
                                            <span className="material-symbols-outlined text-amber-500 text-[18px]">notifications</span>
                                            <span>{formatReminderText(liveAssignment.dueDate, liveAssignment.reminder)}</span>
                                        </div>
                                        {liveAssignment.reminder.sentAt && (
                                            <span className="text-xs text-amber-600 dark:text-amber-400 mt-1 block">
                                                Sent on {new Date(liveAssignment.reminder.sentAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Exam Type Tag if exists */}
                                {liveAssignment.examType && (
                                    <div>
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block mb-2">Type</span>
                                        {liveAssignment.examType === 'midterm' ? (
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

                                {/* Notes Section */}
                                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 border border-gray-100 dark:border-white/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Notes
                                        </h3>
                                        <button
                                            onClick={() => setIsNotesFullscreen(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                                        >
                                            <Maximize2 className="w-4 h-4" />
                                            Edit
                                        </button>
                                    </div>
                                    <NotesViewer content={notesContent} maxHeight="250px" />
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-lg text-white bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Fullscreen Notes Editor */}
                    <NotesFullscreenModal
                        isOpen={isNotesFullscreen}
                        onClose={() => setIsNotesFullscreen(false)}
                        initialContent={notesContent}
                        onSave={async (content) => {
                            await updateAssignment(liveAssignment.id, { notes: content });
                        }}
                        uploadImage={(file) => uploadNoteImage(liveAssignment.id, file)}
                        assignmentTitle={liveAssignment.title}
                    />
                    <ShareManagerModal
                        assignment={liveAssignment}
                        isOpen={isShareModalOpen}
                        onClose={() => setIsShareModalOpen(false)}
                        resetKey={assignment.id}
                    />
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ViewAssignmentModal;
