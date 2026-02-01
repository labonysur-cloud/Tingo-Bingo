"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    text?: string;
}

export function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
    const sizes = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12"
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Loader2 className={`${sizes[size]} text-primary animate-spin`} />
            {text && <p className="text-sm text-gray-500 font-medium">{text}</p>}
        </div>
    );
}

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded-lg ${className}`}
            style={{
                animation: "shimmer 2s infinite linear"
            }}
        />
    );
}

export function PostSkeleton() {
    return (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>

            {/* Image */}
            <Skeleton className="w-full h-64" />

            {/* Content */}
            <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-4 pt-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                </div>
            </div>
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="pb-24 bg-gray-50 min-h-screen">
            {/* Cover */}
            <Skeleton className="w-full h-48" />

            {/* Avatar */}
            <div className="px-4 -mt-16">
                <Skeleton className="w-32 h-32 rounded-full border-4 border-white" />
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Stats */}
            <div className="flex gap-4 px-4 py-4">
                <Skeleton className="h-16 flex-1 rounded-2xl" />
                <Skeleton className="h-16 flex-1 rounded-2xl" />
                <Skeleton className="h-16 flex-1 rounded-2xl" />
            </div>
        </div>
    );
}
