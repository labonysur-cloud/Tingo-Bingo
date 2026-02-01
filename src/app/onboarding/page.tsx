"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Onboarding Page - Simplified
 * 
 * TODO: Build proper onboarding flow with:
 * - User profile customization
 * - Pet management (add first pet)
 * - Interest selection
 * 
 * For now, just redirects to main app
 */
export default function OnboardingPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect to home after a brief delay
        const timer = setTimeout(() => {
            router.push("/");
        }, 1500);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to TingoBingo!</h1>
                <p className="text-gray-500">Setting up your account...</p>
            </div>
        </div>
    );
}
