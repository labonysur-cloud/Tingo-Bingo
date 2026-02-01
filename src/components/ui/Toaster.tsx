"use client";

import { Toaster as HotToaster } from 'react-hot-toast';

/**
 * Global Toast Notification Component
 * Place once in root layout to show toast messages app-wide
 */
export function Toaster() {
    return (
        <HotToaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                // Default options
                duration: 3000,
                style: {
                    background: '#1F2937',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                    maxWidth: '500px',
                },
                // Success toast
                success: {
                    duration: 2500,
                    iconTheme: {
                        primary: '#4ADE80', // Green
                        secondary: '#fff',
                    },
                },
                // Error toast
                error: {
                    duration: 4000,
                    iconTheme: {
                        primary: '#EF4444', // Red
                        secondary: '#fff',
                    },
                },
                // Loading toast
                loading: {
                    iconTheme: {
                        primary: '#FF6B35', // Primary orange
                        secondary: '#fff',
                    },
                },
            }}
        />
    );
}

/**
 * Toast utility functions for easy use
 * 
 * Usage:
 *   import { showToast } from '@/components/ui/Toaster';
 *   showToast.success('Profile updated!');
 *   showToast.error('Failed to save post');
 */
import toast from 'react-hot-toast';

export const showToast = {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    loading: (message: string) => toast.loading(message),
    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string;
            error: string;
        }
    ) => toast.promise(promise, messages),
    dismiss: (toastId?: string) => toast.dismiss(toastId),
};
