"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface FollowListModalProps {
    userId: string;
    type: 'followers' | 'following';
    isOpen: boolean;
    onClose: () => void;
}

export default function FollowListModal({ userId, type, isOpen, onClose }: FollowListModalProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        if (!isOpen) return;

        const fetchUsers = async () => {
            setLoading(true);
            try {
                let data: any = null;

                if (type === 'followers') {
                    // Fetch people who follow 'userId'
                    const { data: res, error } = await supabase
                        .from('follows')
                        .select(`
                            follower:users!follower_id (
                                id, name, username, avatar
                            )
                        `)
                        .eq('following_id', userId);

                    if (error) throw error;
                    data = res?.map((item: any) => item.follower);

                } else {
                    // Fetch people 'userId' follows
                    const { data: res, error } = await supabase
                        .from('follows')
                        .select(`
                            following:users!following_id (
                                id, name, username, avatar
                            )
                        `)
                        .eq('follower_id', userId);

                    if (error) throw error;
                    data = res?.map((item: any) => item.following);
                }

                setUsers(data || []);
            } catch (error) {
                console.error("Error fetching follow list:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [userId, type, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold capitalize">{type}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-2 flex-1">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">
                            No users found.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {users.map((user) => (
                                <Link
                                    key={user.id}
                                    href={currentUser?.id === user.id ? '/profile' : `/user/${user.id}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    <img
                                        src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                    />
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                                        <p className="text-xs text-gray-500">@{user.username || 'user'}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
