"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Loader2, Chrome } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginView() {
    const { login, signup, loginWithGoogle, user } = useAuth();
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
                router.push("/");
            } else {
                if (!name) throw new Error("Name is required");
                await signup(name, email, password);
                // TODO: Redirect to onboarding to set up pets
                router.push("/");
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.message || "Something went wrong";
            if (msg.includes("auth/invalid-credential")) setError("Invalid email or password.");
            else if (msg.includes("auth/email-already-in-use")) setError("Email already in use.");
            else if (msg.includes("auth/weak-password")) setError("Password should be at least 6 characters.");
            else setError("Authentication failed. Check your details.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            await loginWithGoogle();
            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError("Google Sign-In failed. Try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-green-100 via-white to-orange-100">
            {/* Ambient Background Elements */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-20 right-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="bg-white/70 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center border border-white/50 relative z-10">
                {/* Logo - Steady, no rotation */}
                <div className="w-28 h-28 mx-auto mb-8 shadow-2xl rounded-3xl p-1 bg-white">
                    <img src="/logo.png" alt="TingoBingo Logo" className="w-full h-full rounded-2xl object-cover" />
                </div>

                <h1 className="text-4xl font-extrabold mb-3 tracking-tight text-gray-900 drop-shadow-sm">
                    TingoBingo
                </h1>
                <p className="text-gray-500 mb-10 font-medium text-lg leading-relaxed">
                    {isLogin ? "Welcome back, human!" : "Join the fluffiest community."}
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl text-left font-semibold border border-red-100 flex items-center gap-2">
                        <span className="text-xl">⚠️</span> {error}
                    </div>
                )}

                {/* Google Login - Premium Button */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="group w-full bg-white border-2 border-gray-100 text-gray-700 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-200 transition-all duration-300 mb-8 shadow-sm hover:shadow-md"
                >
                    <Chrome className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
                    <span className="text-base">Continue with Google</span>
                </button>

                <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white/50 backdrop-blur-sm text-gray-400 font-medium uppercase tracking-wider text-xs">Or with email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isLogin && (
                        <div className="text-left animate-in slide-in-from-top-2 duration-500">
                            <label className="block font-bold text-sm mb-2 text-gray-700 ml-1">Pet's Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Fluffy"
                                className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-gray-400"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="text-left">
                        <label className="block font-bold text-sm mb-2 text-gray-700 ml-1">Email</label>
                        <input
                            type="email"
                            placeholder="hello@tingobingo.com"
                            className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-gray-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="text-left">
                        <label className="block font-bold text-sm mb-2 text-gray-700 ml-1">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-gray-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1A1A1A] text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl hover:bg-black active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>
                                {isLogin ? "Log In" : "Unleash Fun"} <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 text-base text-gray-500 font-medium">
                    {isLogin ? "New to the pack?" : "Already a member?"}
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(""); }}
                        className="text-primary font-bold ml-2 hover:text-orange-600 hover:underline decoration-2 underline-offset-4 transition-colors focus:outline-none"
                    >
                        {isLogin ? "Join Now" : "Log In"}
                    </button>
                </div>
            </div>
        </div>
    );
}
