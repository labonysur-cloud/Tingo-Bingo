"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, action?: Toast["action"]) => void;
    success: (message: string, action?: Toast["action"]) => void;
    error: (message: string, action?: Toast["action"]) => void;
    info: (message: string, action?: Toast["action"]) => void;
    warning: (message: string, action?: Toast["action"]) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const showToast = (
        message: string,
        type: ToastType = "info",
        action?: Toast["action"],
        duration = 4000
    ) => {
        const id = Math.random().toString(36).substring(7);
        const toast: Toast = { id, message, type, action, duration };

        setToasts((prev) => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    };

    const success = (message: string, action?: Toast["action"]) =>
        showToast(message, "success", action);

    const error = (message: string, action?: Toast["action"]) =>
        showToast(message, "error", action);

    const info = (message: string, action?: Toast["action"]) =>
        showToast(message, "info", action);

    const warning = (message: string, action?: Toast["action"]) =>
        showToast(message, "warning", action);

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragX, setDragX] = useState(0);

    const typeConfig = {
        success: {
            icon: CheckCircle,
            bgClass: "bg-green-500",
            textClass: "text-green-900",
            borderClass: "border-green-600"
        },
        error: {
            icon: AlertCircle,
            bgClass: "bg-red-500",
            textClass: "text-red-900",
            borderClass: "border-red-600"
        },
        info: {
            icon: Info,
            bgClass: "bg-blue-500",
            textClass: "text-blue-900",
            borderClass: "border-blue-600"
        },
        warning: {
            icon: AlertTriangle,
            bgClass: "bg-yellow-500",
            textClass: "text-yellow-900",
            borderClass: "border-yellow-600"
        }
    };

    const config = typeConfig[toast.type];
    const Icon = config.icon;

    const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
        setIsDragging(true);
    };

    const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        setDragX(Math.max(0, clientX - 300)); // Assuming starting position
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        if (dragX > 100) {
            onRemove(toast.id);
        } else {
            setDragX(0);
        }
    };

    return (
        <div
            className={`
                ${config.bgClass}
                text-white
                rounded-2xl
                shadow-2xl
                border-2
                ${config.borderClass}
                overflow-hidden
                transform
                transition-all
                duration-300
                animate-in
                slide-in-from-right
                ${dragX > 50 ? "opacity-50" : "opacity-100"}
            `}
            style={{
                transform: `translateX(${dragX}px)`,
                cursor: isDragging ? "grabbing" : "grab"
            }}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
        >
            <div className="p-4 flex items-start gap-3">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight">{toast.message}</p>

                    {toast.action && (
                        <button
                            onClick={() => {
                                toast.action!.onClick();
                                onRemove(toast.id);
                            }}
                            className="mt-2 text-xs font-bold underline hover:no-underline"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>

                <button
                    onClick={() => onRemove(toast.id)}
                    className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Progress Bar */}
            {toast.duration && toast.duration > 0 && (
                <div className="h-1 bg-white/30">
                    <div
                        className="h-full bg-white/60"
                        style={{
                            animation: `shrink ${toast.duration}ms linear forwards`
                        }}
                    />
                </div>
            )}
        </div>
    );
}

// Add keyframe animation to global CSS
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
        }
    `;
    document.head.appendChild(style);
}
