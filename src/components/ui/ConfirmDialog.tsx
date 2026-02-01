"use client";

import { AlertTriangle, X } from "lucide-react";
import { ReactNode } from "react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
    icon?: ReactNode;
}

export default function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    isDestructive = false,
    icon
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Icon Header */}
                <div className={`p-6 pb-0 flex flex-col items-center text-center ${isDestructive ? "text-red-500" : "text-gray-700"
                    }`}>
                    {icon || (isDestructive && (
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-600 leading-relaxed">{description}</p>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }}
                        className={`flex-1 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 ${isDestructive
                                ? "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-xl"
                                : "bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-xl"
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>
        </div>
    );
}
