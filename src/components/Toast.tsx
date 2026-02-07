import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

// =====================================================
// TOAST TYPES
// =====================================================
type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastMessage {
    id: string;
    message: string;
    variant: ToastVariant;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// =====================================================
// TOAST ITEM
// =====================================================
const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const duration = toast.duration || 4000;
        const exitTimer = setTimeout(() => setIsExiting(true), duration - 300);
        const removeTimer = setTimeout(() => onDismiss(toast.id), duration);
        return () => {
            clearTimeout(exitTimer);
            clearTimeout(removeTimer);
        };
    }, [toast, onDismiss]);

    const icons: Record<ToastVariant, React.ReactNode> = {
        success: <CheckCircle size={20} className="text-green-500 flex-shrink-0" />,
        error: <XCircle size={20} className="text-red-500 flex-shrink-0" />,
        warning: <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />,
        info: <Info size={20} className="text-blue-500 flex-shrink-0" />,
    };

    const borderColors: Record<ToastVariant, string> = {
        success: "border-l-green-500",
        error: "border-l-red-500",
        warning: "border-l-amber-500",
        info: "border-l-blue-500",
    };

    return (
        <div
            className={`flex items-start gap-3 bg-white rounded-xl shadow-2xl border border-gray-100 border-l-4 ${borderColors[toast.variant]} px-4 py-3 min-w-[280px] max-w-[400px] transition-all duration-300 ${isExiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
                }`}
        >
            {icons[toast.variant]}
            <p className="text-sm text-gray-700 flex-1 leading-relaxed">{toast.message}</p>
            <button
                onClick={() => {
                    setIsExiting(true);
                    setTimeout(() => onDismiss(toast.id), 300);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
                <X size={16} />
            </button>
        </div>
    );
};

// =====================================================
// TOAST PROVIDER
// =====================================================
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, variant: ToastVariant = "info", duration: number = 4000) => {
        const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
        setToasts((prev) => [...prev, { id, message, variant, duration }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-auto">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

// =====================================================
// HOOK
// =====================================================
export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        // Fallback for components outside provider - use native alert
        return {
            showToast: (message: string, variant?: ToastVariant) => {
                console.warn("[Toast] Used outside provider, falling back to console.", message);
                if (variant === "error") console.error(message);
                else console.log(message);
            },
        };
    }
    return context;
};
