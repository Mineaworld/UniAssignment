import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context';
import { Subject } from '../types';
import { SUBJECT_COLORS } from '../constants/colors';

interface EditSubjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    subject: Subject | null;
}

const EditSubjectModal: React.FC<EditSubjectModalProps> = ({ isOpen, onClose, subject }) => {
    const { updateSubject } = useApp();
    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(SUBJECT_COLORS[0]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (subject) {
            setName(subject.name);
            setSelectedColor(subject.color);
        }
    }, [subject]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !name) return;

        setLoading(true);
        try {
            await updateSubject(subject.id, {
                name,
                color: selectedColor
            });

            onClose();
        } catch (error) {
            console.error("Failed to update subject:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!subject) return null;

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
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="pointer-events-auto relative w-full max-w-md bg-background dark:bg-[#101622] rounded-2xl shadow-2xl border border-border/20 overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border/20 dark:border-white/10 bg-background dark:bg-[#101622]">
                                <h2 className="text-xl font-bold text-foreground">Edit Subject</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Subject Name</span>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Advanced Calculus"
                                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 h-12 px-4"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </label>

                                <div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Color Code</span>
                                    <div className="mt-3 grid grid-cols-4 sm:grid-cols-5 gap-3">
                                        {SUBJECT_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setSelectedColor(color)}
                                                className={`
                        min-w-[44px] min-h-[44px] w-11 h-11 rounded-full ${color} transition-all transform hover:scale-110 flex items-center justify-center
                        ${selectedColor === color ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-[#101622] scale-110' : ''}
                      `}
                                            >
                                                {selectedColor === color && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 rounded-lg text-slate-700 dark:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 font-semibold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 rounded-lg text-white bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
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

export default EditSubjectModal;
