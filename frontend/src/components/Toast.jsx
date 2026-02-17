import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
    React.useEffect(() => {
        if (duration) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: { Icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
        error: { Icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
        warning: { Icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
        info: { Icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
    };

    const { Icon, color, bg, border } = icons[type] || icons.info;

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border-2 ${bg} ${border} min-w-[320px] max-w-md backdrop-blur-sm`}
        >
            <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
            <p className="flex-1 text-sm font-medium text-gray-800">{message}</p>
            <button
                onClick={onClose}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
            >
                <X className="w-4 h-4 text-gray-500" />
            </button>
        </motion.div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                        duration={toast.duration}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

// Hook to use toasts
export const useToast = () => {
    const [toasts, setToasts] = React.useState([]);

    const addToast = React.useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = React.useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
};

export default Toast;
