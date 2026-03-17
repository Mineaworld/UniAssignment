import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context';
import { ReminderSelector } from './ReminderSelector';
import { NotesEditor } from './notes';
import { DEFAULT_SUBJECT_COLOR } from '../constants/colors';
import { buildLocalIsoString } from '../utils/dateUtils';
import { AssignmentBasicsFields } from './assignment-form/AssignmentBasicsFields';
import { AssignmentClassificationFields } from './assignment-form/AssignmentClassificationFields';
import { SubjectQuickCreatePanel } from './assignment-form/SubjectQuickCreatePanel';
import { AssignmentFormState, createEmptyAssignmentFormState } from './assignment-form/types';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateAssignmentModal = ({ isOpen, onClose }: CreateAssignmentModalProps) => {
  const { subjects, addAssignment, addSubject } = useApp();
  const [formData, setFormData] = useState<AssignmentFormState>(createEmptyAssignmentFormState);

  const [loading, setLoading] = useState(false);

  // Inline subject creation state
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [subjectSuccess, setSubjectSuccess] = useState('');

  // Clear success message after 3 seconds
  useEffect(() => {
    if (!subjectSuccess) return;

    const timer = setTimeout(() => setSubjectSuccess(''), 3000);
    return () => clearTimeout(timer);
  }, [subjectSuccess]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName) return;

    setSubjectLoading(true);
    try {
      await addSubject({
        name: newSubjectName,
        color: DEFAULT_SUBJECT_COLOR
      });
      // Reset form and close on success
      setNewSubjectName('');
      setSubjectSuccess('');
      setShowSubjectForm(false);
    } catch (error) {
      console.error("Failed to add subject:", error);
    } finally {
      setSubjectLoading(false);
    }
  };

  const handleCloseSubjectForm = () => {
    setShowSubjectForm(false);
    setNewSubjectName('');
    setSubjectSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.subjectId || !formData.date) return;

    setLoading(true);
    // Combine date and time
    const dateTime = formData.time
      ? buildLocalIsoString(formData.date, formData.time)
      : buildLocalIsoString(formData.date);

    try {
      await addAssignment({
        title: formData.title,
        subjectId: formData.subjectId,
        status: formData.status,
        dueDate: dateTime,
        priority: formData.priority,
        notes: formData.notes,
        examType: formData.examType,
        ...(formData.reminder ? { reminder: formData.reminder } : {}),
      });

      // Reset and close
      setFormData(createEmptyAssignmentFormState());
      onClose();
    } catch (error) {
      console.error("Failed to create assignment:", error);
      // Optionally set an error state here to display to user
    } finally {
      setLoading(false);
    }
  };

  const selectableSubjects = subjects.filter((subject) => subject.canCreateAssignments !== false);

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
                <h2 className="text-xl font-bold text-foreground">Create New Assignment</h2>
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
                  formData={formData}
                  onChange={(updates) => setFormData((current) => ({ ...current, ...updates }))}
                  onOpenSubjectForm={() => setShowSubjectForm(true)}
                  subjects={selectableSubjects}
                />

                <SubjectQuickCreatePanel
                  loading={subjectLoading}
                  name={newSubjectName}
                  onChangeName={setNewSubjectName}
                  onClose={handleCloseSubjectForm}
                  onSubmit={handleCreateSubject}
                  open={showSubjectForm}
                  successMessage={subjectSuccess}
                />

                <AssignmentClassificationFields
                  formData={formData}
                  onChange={(updates) => setFormData((current) => ({ ...current, ...updates }))}
                />

                <ReminderSelector
                  dueDate={
                    formData.date
                      ? buildLocalIsoString(formData.date, formData.time || undefined)
                      : new Date().toISOString()
                  }
                  value={formData.reminder}
                  onChange={(reminder) => setFormData({ ...formData, reminder })}
                />

                <div className="block">
                  <span className="text-sm font-medium text-foreground/80 mb-2 block">Notes</span>
                  <div className="rounded-lg border border-border/60 bg-background/80 dark:bg-slate-800/50 overflow-hidden min-h-[150px]">
                    <NotesEditor
                      initialContent={formData.notes}
                      onChange={(notes) => setFormData({ ...formData, notes })}
                      compact={true}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Images can be added after the assignment is created.
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/20 dark:border-white/10">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-lg text-foreground bg-muted hover:bg-muted/80 dark:bg-white/5 dark:hover:bg-white/10 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    data-testid="assignment-submit-button"
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Assignment'}
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

export default CreateAssignmentModal;
