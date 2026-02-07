import React from "react";

interface ConfirmationModalProps {
    isOpen: boolean;
    title?: string;
    message: string | React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onClose: () => void;
    variant?: "danger" | "warning" | "info";
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title = "Confirm Action",
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onClose,
    variant = "danger",
}) => {
    if (!isOpen) return null;

    const getButtonColor = () => {
        switch (variant) {
            case "danger":
                return "bg-red-500 hover:bg-red-600 focus:ring-red-500";
            case "warning":
                return "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500";
            case "info":
                return "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500";
            default:
                return "bg-bakery-primary hover:bg-bakery-primary/90 focus:ring-bakery-primary";
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="font-serif text-xl font-bold text-bakery-dark mb-2">
                    {title}
                </h3>

                <div className="text-bakery-text/80 mb-6 text-sm leading-relaxed">
                    {typeof message === 'string' ? <p>{message}</p> : message}
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-bakery-text/70 hover:bg-gray-100 transition-colors font-medium text-sm"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg text-white transition-colors font-medium shadow-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonColor()}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
