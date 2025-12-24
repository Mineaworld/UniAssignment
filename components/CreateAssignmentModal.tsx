import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Priority, Status, AssignmentReminder } from '../types';
import { useApp } from '../context';
import { ReminderSelector } from './ReminderSelector';

// Form data type for type safety
interface FormData {
  title: string;
  subjectId: string;
  status: Status;
  date: string;
  time: string;
  priority: Priority;
  description: string;
  examType: 'midterm' | 'final' | null;
  reminder: AssignmentReminder | undefined;
}

const DEFAULT_FORM_DATA: Omit<FormData, 'reminder'> & { reminder: AssignmentReminder | undefined } = {
  title: '',
  subjectId: '',
  status: Status.Pending,
  date: '',
  time: '',
  priority: Priority.Medium,
  description: '',
  examType: null,
  reminder: undefined,
};

const getResetFormData = (): FormData => ({
  ...DEFAULT_FORM_DATA,
  reminder: undefined,
});

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ isOpen, onClose }) => {
  const { subjects, addAssignment, addSubject } = useApp();
  const [formData, setFormData] = useState<FormData>(getResetFormData);

  const [loading, setLoading] = useState(false);

  // Inline subject creation state
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('bg-blue-500');
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [subjectSuccess, setSubjectSuccess] = useState('');

  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-red-500',
    'bg-yellow-500', 'bg-purple-500', 'bg-pink-500',
    'bg-indigo-500', 'bg-orange-500', 'bg-teal-500'
  ];

  // Clear success message after 3 seconds
  useEffect(() => {
    if (subjectSuccess) {
      const timer = setTimeout(() => setSubjectSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [subjectSuccess]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName) return;

    setSubjectLoading(true);
    try {
      await addSubject({
        name: newSubjectName,
        color: newSubjectColor
      });
      // Reset form and close on success
      setNewSubjectName('');
      setNewSubjectColor('bg-blue-500');
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
    setNewSubjectColor('bg-blue-500');
    setSubjectSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.subjectId || !formData.date) return;

    setLoading(true);
    // Combine date and time
    const dateTime = formData.time
      ? new Date(`${formData.date}T${formData.time}`).toISOString()
      : new Date(formData.date).toISOString();

    try {
      await addAssignment({
        title: formData.title,
        subjectId: formData.subjectId,
        status: formData.status,
        dueDate: dateTime,
        priority: formData.priority,
        description: formData.description,
        examType: formData.examType,
        reminder: formData.reminder,
      });

      // Reset and close
      setFormData(getResetFormData());
      onClose();
    } catch (error) {
      console.error("Failed to create assignment:", error);
      // Optionally set an error state here to display to user
    } finally {
      setLoading(false);
    }
  };

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
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Assignment</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/60 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Assignment Title</span>
                <input
                  type="text"
                  required
                  placeholder="e.g., History Essay - Chapter 5 Analysis"
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 h-12 px-4"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subject Selection with Add Button */}
                <div className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Subject</span>
                  <div className="mt-1 flex gap-2">
                    <select
                      required
                      className="flex-1 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 h-12 px-4"
                      value={formData.subjectId}
                      onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                    >
                      <option value="">Select a subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowSubjectForm(true)}
                      className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 flex items-center justify-center transition-colors"
                      title="Add new subject"
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</span>
                  <select
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 h-12 px-4"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as Status })}
                  >
                    <option value={Status.Pending}>Not Started</option>
                    <option value={Status.InProgress}>In Progress</option>
                    <option value={Status.Completed}>Completed</option>
                  </select>
                </label>
              </div>

              {/* Inline Subject Creation Form */}
              <AnimatePresence>
                {showSubjectForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-lg">add_circle</span>
                          Quick Add Subject
                        </h3>
                        <button
                          type="button"
                          onClick={handleCloseSubjectForm}
                          className="p-1 rounded-full hover:bg-white/50 dark:hover:bg-black/20 text-slate-500 dark:text-white/60 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>

                      {/* Success Message */}
                      <AnimatePresence>
                        {subjectSuccess && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-3 p-2 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">{subjectSuccess}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Subject name (e.g., Mathematics)"
                          className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 h-10 px-3 text-sm"
                          value={newSubjectName}
                          onChange={e => setNewSubjectName(e.target.value)}
                        />

                        <div>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">Color</span>
                          <div className="flex flex-wrap gap-2">
                            {colors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setNewSubjectColor(color)}
                                className={`
                                  w-7 h-7 rounded-full ${color} transition-all transform hover:scale-110 flex items-center justify-center
                                  ${newSubjectColor === color ? 'ring-2 ring-offset-1 ring-primary dark:ring-offset-[#101622] scale-110' : ''}
                                `}
                              >
                                {newSubjectColor === color && <span className="material-symbols-outlined text-white text-xs">check</span>}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={handleCloseSubjectForm}
                            className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-white/70 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/30 text-sm font-medium transition-colors"
                          >
                            Done
                          </button>
                          <button
                            type="button"
                            onClick={handleCreateSubject}
                            disabled={!newSubjectName || subjectLoading}
                            className="px-4 py-1.5 rounded-lg text-white bg-primary hover:bg-primary/90 text-sm font-semibold shadow-md shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {subjectLoading ? 'Adding...' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</span>
                  <input
                    type="date"
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 h-12 px-4"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Due Time</span>
                  <input
                    type="time"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 h-12 px-4"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                  />
                </label>
              </div>

              <div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Assignment Type</span>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  <label
                    className={`
                        relative flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all
                        ${!formData.examType
                        ? 'border-gray-500 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white ring-1 ring-gray-500'
                        : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                      }
                      `}
                  >
                    <input
                      type="radio"
                      name="examType"
                      value=""
                      checked={!formData.examType}
                      onChange={() => setFormData({ ...formData, examType: null })}
                      className="sr-only"
                    />
                    <span className="font-medium">Regular</span>
                  </label>
                  <label
                    className={`
                        relative flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all
                        ${formData.examType === 'midterm'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500'
                        : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                      }
                      `}
                  >
                    <input
                      type="radio"
                      name="examType"
                      value="midterm"
                      checked={formData.examType === 'midterm'}
                      onChange={() => setFormData({ ...formData, examType: 'midterm' })}
                      className="sr-only"
                    />
                    <span className="font-medium">Midterm</span>
                  </label>
                  <label
                    className={`
                        relative flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all
                        ${formData.examType === 'final'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500'
                        : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                      }
                      `}
                  >
                    <input
                      type="radio"
                      name="examType"
                      value="final"
                      checked={formData.examType === 'final'}
                      onChange={() => setFormData({ ...formData, examType: 'final' })}
                      className="sr-only"
                    />
                    <span className="font-medium">Final</span>
                  </label>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Priority</span>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {[Priority.Low, Priority.Medium, Priority.High].map((p) => (
                    <label
                      key={p}
                      className={`
                        relative flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all
                        ${formData.priority === p
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                          : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={formData.priority === p}
                        onChange={() => setFormData({ ...formData, priority: p })}
                        className="sr-only"
                      />
                      <span className="font-medium">{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <ReminderSelector
                dueDate={formData.date ? new Date(formData.date).toISOString() : new Date().toISOString()}
                value={formData.reminder}
                onChange={(reminder) => setFormData({ ...formData, reminder })}
              />

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Description / Notes</span>
                <textarea
                  rows={4}
                  placeholder="Add details..."
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 p-4"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </label>

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
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg text-white bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateAssignmentModal;

