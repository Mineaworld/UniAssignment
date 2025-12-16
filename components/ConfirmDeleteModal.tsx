import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    itemName: string;
    itemType: 'assignment' | 'subject';
    loading?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    itemName,
    itemType,
    loading = false
}) => {
    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
                        className="relative w-full max-w-md bg-white dark:bg-[#101622] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
                    >
                        {/* Header with Warning Icon */}
                        <div className="p-6 pb-0 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">
                                    delete_forever
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {title}
                            </h2>
                        </div>

                        {/* Content */}
                        <div className="p-6 text-center">
                            <p className="text-slate-600 dark:text-slate-400">
                                Are you sure you want to delete{' '}
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    "{itemName}"
                                </span>
                                ? This action cannot be undone.
                            </p>

                            {itemType === 'subject' && (
                                <p className="mt-3 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg p-3">
                                    <span className="material-symbols-outlined text-sm align-middle mr-1">warning</span>
                                    Assignments linked to this subject will not be deleted.
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-6 pt-0 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 px-6 py-3 rounded-xl text-slate-700 dark:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 font-semibold transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={loading}
                                className="flex-1 px-6 py-3 rounded-xl text-white bg-red-600 hover:bg-red-700 font-bold shadow-lg shadow-red-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Deleting...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                        Delete
                                    </span>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDeleteModal;
