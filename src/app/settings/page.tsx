"use client";

import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, ChevronRight, User, HelpCircle, Info, LogOut, Shield, Heart, Trash2, AlertTriangle, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SettingsView() {
    const { user, logout, deleteAccount } = useAuth();
    const router = useRouter();

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const handleLogout = async () => {
        await logout();
        router.replace("/");
    };

    const handleDeleteAccount = async () => {
        if (!user) return;

        setDeleteLoading(true);
        setDeleteError('');

        try {
            await deleteAccount();
            // User will be automatically logged out
            router.replace('/');
        } catch (error: any) {
            console.error('Delete error:', error);
            setDeleteError(error.message || 'Failed to delete account');
            setDeleteLoading(false);
        }
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

                {/* Danger Zone */}
                <section>
                    <h2 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-2 px-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Danger Zone
                    </h2>
                    <div className="bg-white rounded-2xl shadow-sm border-2 border-red-200 overflow-hidden p-4">
                        <p className="text-sm text-gray-600 mb-4">
                            Once you delete your account, there is no going back. All your data will be permanently removed.
                        </p>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors w-full"
                        >
                            <Trash2 className="w-5 h-5" />
                            Delete Account
                        </button>
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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6" />
                                Delete Account?
                            </h2>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleteLoading}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-700 mb-3">
                                This action is <strong>permanent</strong> and <strong>cannot be undone</strong>.
                            </p>
                            <p className="text-sm text-gray-600 mb-3">
                                All your data will be permanently deleted:
                            </p>
                            <ul className="list-disc ml-5 mb-4 text-sm text-gray-600 space-y-1">
                                <li>Your profile information</li>
                                <li>All your posts and photos</li>
                                <li>Your pets' profiles</li>
                                <li>Your comments and likes</li>
                                <li>Your followers and following</li>
                            </ul>

                            {deleteError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
                                    {deleteError}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleteLoading}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleteLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-5 h-5" />
                                        Delete Forever
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
