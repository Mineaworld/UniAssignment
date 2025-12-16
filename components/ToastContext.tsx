import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getToastStyles = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'bg-emerald-500 dark:bg-emerald-600';
            case 'error':
                return 'bg-red-500 dark:bg-red-600';
            case 'info':
            default:
                return 'bg-primary dark:bg-primary';
        }
    };

    const getToastIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'check_circle';
            case 'error':
                return 'error';
            case 'info':
            default:
                return 'info';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 md:bottom-6 md:right-6">
                <AnimatePresence mode="popLayout">
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={`${getToastStyles(toast.type)} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px] max-w-[400px]`}
                            role="alert"
                            aria-live="polite"
                        >
                            <span className="material-symbols-outlined text-xl">
                                {getToastIcon(toast.type)}
                            </span>
                            <span className="flex-1 font-medium text-sm">{toast.message}</span>
                            <button
                                onClick={() => dismissToast(toast.id)}
                                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                aria-label="Dismiss notification"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
