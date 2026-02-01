"use client";

import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, ChevronRight, User, HelpCircle, Info, LogOut, Shield, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsView() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace("/");
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100 shadow-sm sticky top-0 z-10">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Settings</h1>
            </header>

            <div className="p-4 space-y-6">
                {/* Account Section */}
                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Account</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center gap-4 p-4 border-b border-gray-50">
                            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{user?.name || "Guest"}</p>
                                <p className="text-sm text-gray-500">{user?.email || "Not signed in"}</p>
                            </div>
                        </div>
                        <Link href="/profile" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-600" />
                                <span className="font-medium text-gray-700">Edit Profile</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                    </div>
                </section>

                {/* Support & Info */}
                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Support & Info</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                        <Link href="/about" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Info className="w-5 h-5 text-blue-500" />
                                <span className="font-medium text-gray-700">About TingoBingo</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                        <Link href="/faq" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <HelpCircle className="w-5 h-5 text-orange-500" />
                                <span className="font-medium text-gray-700">FAQ</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                        <Link href="#" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-green-500" />
                                <span className="font-medium text-gray-700">Privacy Policy</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                    </div>
                </section>

                {/* App Info */}
                <section className="text-center py-4">
                    <button
                        onClick={handleLogout}
                        className="text-red-500 font-bold flex items-center justify-center gap-2 mx-auto hover:bg-red-50 px-6 py-2 rounded-full transition-colors mb-6"
                    >
                        <LogOut className="w-5 h-5" />
                        Log Out
                    </button>

                    <div className="flex flex-col items-center gap-1 opacity-50">
                        <div className="w-8 h-8 bg-gradient-to-tr from-secondary to-primary rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm mb-2">t</div>
                        <p className="text-xs text-gray-500 font-medium">TingoBingo v1.0.0</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">Made with <Heart className="w-3 h-3 text-red-400 fill-current" /> for Pets</p>
                    </div>
                </section>
            </div>
        </div>
    );
}
