"use client";

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    children?: ReactNode;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    children
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            {/* Icon Circle */}
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Icon className="w-16 h-16 text-gray-400" strokeWidth={1.5} />
            </div>

            {/* Text */}
            <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-sm leading-relaxed mb-6">{description}</p>

            {/* Action */}
            {action && (
                <button
                    onClick={action.onClick}
                    className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-3 rounded-2xl font-bold hover:shadow-xl transition-all active:scale-95"
                >
                    {action.label}
                </button>
            )}

            {/* Custom Content */}
            {children}
        </div>
    );
}
