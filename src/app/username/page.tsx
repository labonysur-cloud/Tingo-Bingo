"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, Check, X, AtSign } from "lucide-react";

export default function SetupUsernamePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [checking, setChecking] = useState(false);
    const [available, setAvailable] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Check if user already has a username
    useEffect(() => {
        if (!user) return;

        const checkExistingUsername = async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('username')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                // If user already has a username, redirect to home
                if (data?.username) {
                    router.push("/");
                }
            } catch (error) {
                console.error("Error checking username:", error);
            }
        };

        checkExistingUsername();
    }, [user, router]);

    // Debounced username availability check
    useEffect(() => {
        if (!username || username.length < 3) {
            setAvailable(null);
            return;
        }

        // Validate username format (alphanumeric + underscore only)
        const validFormat = /^[a-zA-Z0-9_]+$/.test(username);
        if (!validFormat) {
            setAvailable(false);
            setError("Username can only contain letters, numbers, and underscores");
            return;
        }

        setError("");
        setChecking(true);

        const timer = setTimeout(async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('username')
                    .eq('username', username.toLowerCase())
                    .maybeSingle();

                if (error) throw error;

                setAvailable(!data); // Available if no matching user found
            } catch (error) {
                console.error("Error checking username:", error);
                setAvailable(null);
            } finally {
                setChecking(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !username || !available) return;

        setLoading(true);
        setError("");

        try {
            // Update user with username
            const { error } = await supabase
                .from('users')
                .update({ username: username.toLowerCase() })
                .eq('id', user.id);

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    setError("This username is already taken. Please choose another.");
                    setAvailable(false);
                } else {
                    throw error;
                }
                return;
            }

            // Success! Redirect to home
            alert(`Username @${username} set successfully! 🎉`);
            router.push("/");

        } catch (error: any) {
            console.error("Error setting username:", error);
            setError(error.message || "Failed to set username. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-6">
            <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/50">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                    <AtSign className="w-10 h-10 text-white" />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-2">
                    Choose Your Username
                </h1>
                <p className="text-gray-500 text-center mb-8">
                    This is how others will find and mention you
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Username
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-3.5 text-gray-400 font-bold text-lg">
                                @
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                placeholder="yourname"
                                minLength={3}
                                maxLength={20}
                                required
                            />
                            {/* Status Icon */}
                            <div className="absolute right-4 top-3.5">
                                {checking && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
                                {!checking && available === true && (
                                    <Check className="w-5 h-5 text-green-500" />
                                )}
                                {!checking && available === false && (
                                    <X className="w-5 h-5 text-red-500" />
                                )}
                            </div>
                        </div>

                        {/* Feedback Messages */}
                        <div className="mt-2 min-h-[20px]">
                            {username.length > 0 && username.length < 3 && (
                                <p className="text-xs text-gray-400">
                                    Username must be at least 3 characters
                                </p>
                            )}
                            {available === true && !checking && (
                                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    <Check className="w-3 h-3" /> @{username} is available!
                                </p>
                            )}
                            {available === false && !checking && !error && (
                                <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                                    <X className="w-3 h-3" /> @{username} is already taken
                                </p>
                            )}
                            {error && (
                                <p className="text-xs text-red-600 font-medium">
                                    {error}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !available || checking || !username}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>Continue</>
                        )}
                    </button>
                </form>

                {/* Tips */}
                <div className="mt-8 p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <p className="text-xs text-purple-800 font-medium mb-2">✨ Username Tips:</p>
                    <ul className="text-xs text-purple-700 space-y-1">
                        <li>• 3-20 characters</li>
                        <li>• Letters, numbers, and underscores only</li>
                        <li>• Cannot be changed later (choose wisely!)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
