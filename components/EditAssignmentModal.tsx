import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Priority, Status, Assignment } from '../types';
import { useApp } from '../context';

interface EditAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: Assignment | null;
}

const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({ isOpen, onClose, assignment }) => {
    const { subjects, updateAssignment } = useApp();
    const [formData, setFormData] = useState({
        title: '',
        subjectId: '',
        status: Status.Pending,
        date: '',
        time: '',
        priority: Priority.Medium,
        description: '',
        examType: null as 'midterm' | 'final' | null
    });

    const [loading, setLoading] = useState(false);

    // Populate form when assignment changes
    useEffect(() => {
        if (assignment) {
            const dueDate = new Date(assignment.dueDate);
            setFormData({
                title: assignment.title,
                subjectId: assignment.subjectId,
                status: assignment.status,
                date: dueDate.toISOString().split('T')[0],
                time: dueDate.toTimeString().slice(0, 5),
                priority: assignment.priority,
                description: assignment.description || '',
                examType: assignment.examType || null
            });
        }
    }, [assignment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignment || !formData.title || !formData.subjectId || !formData.date) return;

        setLoading(true);

        // Combine date and time
        const dateTime = formData.time
            ? new Date(`${formData.date}T${formData.time}`).toISOString()
            : new Date(formData.date).toISOString();

        try {
            await updateAssignment(assignment.id, {
                title: formData.title,
                subjectId: formData.subjectId,
                status: formData.status,
                dueDate: dateTime,
                priority: formData.priority,
                description: formData.description,
                examType: formData.examType
            });

            onClose();
        } catch (error) {
            console.error("Failed to update assignment:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!assignment) return null;

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
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Assignment</h2>
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
                                {/* Subject Selection */}
                                <div className="block">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Subject</span>
                                    <div className="mt-1">
                                        <select
                                            required
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 h-12 px-4"
                                            value={formData.subjectId}
                                            onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                                        >
                                            <option value="">Select a subject</option>
                                            {subjects.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</span>
                                    <select
                                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 h-12 px-4"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as Status })}
                                    >
                                        <option value={Status.Pending}>Not Started</option>
                                        <option value={Status.InProgress}>In Progress</option>
                                        <option value={Status.Completed}>Completed</option>
                                    </select>
                                </label>
                            </div>

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
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EditAssignmentModal;
