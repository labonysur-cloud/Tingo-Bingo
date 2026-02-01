"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { supabase } from "@/lib/supabase";
import { Mail, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGoogleSignup = async () => {
        setLoading(true);
        setError("");

        try {
            // Sign in with Google
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if user exists in Supabase
            const { data: existingUser } = await supabase
                .from('users')
                .select('id, primary_pet_id')
                .eq('id', user.uid)
                .single();

            if (existingUser) {
                // User exists - check if they have completed setup
                if (!existingUser.primary_pet_id) {
                    // No primary pet = incomplete setup
                    router.push('/setup/profile');
                } else {
                    // Complete setup = go to home
                    router.push('/');
                }
            } else {
                // New user - create basic record and go to setup
                await supabase.from('users').insert({
                    id: user.uid,
                    email: user.email,
                    name: user.displayName || 'Pet Lover',
                    avatar: user.photoURL,
                });

                router.push('/setup/profile');
            }
        } catch (err: any) {
            console.error("Google signup error:", err);
            setError(err.message || "Failed to sign up with Google");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-2xl">
                        <span className="text-4xl">🐾</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                        Welcome to TingoBingo
                    </h1>
                    <p className="text-gray-500">
                        Join the pet-loving community!
                    </p>
                </div>

                {/* Signup Options */}
                <div className="space-y-4 mb-6">
                    {/* Google Signup */}
                    <button
                        onClick={handleGoogleSignup}
                        disabled={loading}
                        className="w-full bg-white border-2 border-gray-200 hover:border-blue-500 text-gray-700 font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </>
                        )}
                    </button>

                    {/* Email Signup */}
                    <Link href="/signup/email">
                        <button
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            <Mail className="w-5 h-5" />
                            Sign up with Email
                        </button>
                    </Link>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                        {error}
                    </div>
                )}

                {/* Login Link */}
                <div className="text-center">
                    <p className="text-gray-600">
                        Already have an account?{" "}
                        <Link href="/" className="text-purple-600 font-bold hover:underline">
                            Log In
                        </Link>
                    </p>
                </div>

                {/* Terms */}
                <p className="text-xs text-gray-400 text-center mt-6">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
