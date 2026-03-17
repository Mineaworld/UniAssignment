import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Assignment } from '../types';
import { useApp } from '../context';
import { ReminderSelector } from './ReminderSelector';
import { NotesEditor } from './notes';
import {
    buildLocalIsoString,
} from '../utils/dateUtils';
import { AssignmentBasicsFields } from './assignment-form/AssignmentBasicsFields';
import { AssignmentClassificationFields } from './assignment-form/AssignmentClassificationFields';
import {
    AssignmentFormState,
    assignmentToFormState,
    createEmptyAssignmentFormState,
} from './assignment-form/types';
import { getAssignmentSubject } from '../utils/assignmentSubject';

interface EditAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: Assignment | null;
}

const EditAssignmentModal = ({ isOpen, onClose, assignment }: EditAssignmentModalProps) => {
    const { subjects, updateAssignment } = useApp();
    const [formData, setFormData] = useState<AssignmentFormState>(createEmptyAssignmentFormState);

    const [loading, setLoading] = useState(false);

    // Populate form when assignment changes
    useEffect(() => {
        if (assignment) {
            setFormData(assignmentToFormState(assignment));
        }
    }, [assignment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignment || !formData.date) return;

        const canEditSharedFields = assignment.isShared ? Boolean(assignment.canEditSharedFields) : true;
        const canEditPersonalFields = assignment.isShared ? Boolean(assignment.canEditPersonalFields) : true;
        const lockedSubject = assignment.isShared;

        if (canEditSharedFields && !formData.title) return;
        if (!lockedSubject && !formData.subjectId) return;

        setLoading(true);

        // Combine date and time
        const dateTime = formData.time
            ? buildLocalIsoString(formData.date, formData.time)
            : buildLocalIsoString(formData.date);

        try {
            const nextUpdates: Partial<Assignment> = {};

            if (canEditSharedFields) {
                nextUpdates.title = formData.title;
                nextUpdates.dueDate = dateTime;
                nextUpdates.priority = formData.priority;
                nextUpdates.examType = formData.examType;

                if (!lockedSubject) {
                    nextUpdates.subjectId = formData.subjectId;
                }
            }

            if (canEditPersonalFields) {
                nextUpdates.status = formData.status;
                nextUpdates.notes = formData.notes;
                nextUpdates.reminder = formData.reminder;
            }

            await updateAssignment(assignment.id, nextUpdates);

            onClose();
        } catch (error) {
            console.error("Failed to update assignment:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!assignment) return null;

    const canEditSharedFields = assignment.isShared ? Boolean(assignment.canEditSharedFields) : true;
    const lockedSubjectLabel = assignment.isShared
        ? getAssignmentSubject(assignment, subjects)?.name ?? 'Shared subject'
        : null;
    const selectableSubjects = subjects.filter((subject) => (
        subject.canCreateAssignments !== false || subject.id === formData.subjectId
    ));

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
                        >
                            {/* Header */}
                            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border/20 dark:border-white/10 bg-background dark:bg-[#101622]">
                                <h2 className="text-xl font-bold text-foreground">Edit Assignment</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] sm:max-h-[85vh] overflow-y-auto custom-scrollbar">
                                <AssignmentBasicsFields
                                    disableScheduleFields={!canEditSharedFields}
                                    formData={formData}
                                    lockedSubjectLabel={lockedSubjectLabel}
                                    onChange={(updates) => setFormData((current) => ({ ...current, ...updates }))}
                                    subjects={selectableSubjects}
                                />

                                <AssignmentClassificationFields
                                    disabled={!canEditSharedFields}
                                    formData={formData}
                                    onChange={(updates) => setFormData((current) => ({ ...current, ...updates }))}
                                    tone="muted"
                                />

                                <ReminderSelector
                                    dueDate={
                                        formData.date
                                            ? buildLocalIsoString(formData.date, formData.time || undefined)
                                            : new Date().toISOString()
                                    }
                                    disabled={assignment.isShared ? !assignment.canEditPersonalFields : false}
                                    value={formData.reminder}
                                    onChange={(reminder) => setFormData({ ...formData, reminder })}
                                />

                                <div className="block">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Notes</span>
                                    <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800/50 overflow-hidden min-h-[150px]">
                                        <NotesEditor
                                            initialContent={formData.notes}
                                            onChange={(notes) => setFormData({ ...formData, notes })}
                                            compact={true}
                                        />
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-2.5 rounded-lg text-slate-700 dark:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 font-semibold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        data-testid="assignment-submit-button"
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 rounded-lg text-white bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default EditAssignmentModal;
