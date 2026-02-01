"use client";

import { useAuth } from "@/context/AuthContext";
import { useSocial } from "@/context/SocialContext";
import CreatePost from "../feed/CreatePost";
import { Settings, Loader2, Heart, MessageCircle, Send } from "lucide-react";
import HighlightsBar from "./HighlightsBar";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Post {
    id: string;
    user_id: string;
    content: string;
    image_url?: string;
    likes_count: number;
    created_at: string;
}

interface ProfileViewProps {
    userId?: string; // If undefined, show current user
}

export default function ProfileView({ userId }: ProfileViewProps) {
    const { user: currentUser, logout, isLoading: authLoading } = useAuth();
    const { addComment } = useSocial();
    const router = useRouter();

    // Determine which user to show
    const targetUserId = userId || currentUser?.id;
    const isMe = currentUser?.id === targetUserId;

    const [profileData, setProfileData] = useState<any>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
    const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

    // Follow System State
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    // Fetch Profile & Counts
    useEffect(() => {
        if (!targetUserId) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Profile
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', targetUserId)
                    .maybeSingle();

                if (userData) setProfileData(userData);

                // 2. Fetch Follow Counts
                const { count: followers } = await supabase
                    .from('follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('following_id', targetUserId);

                const { count: following } = await supabase
                    .from('follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('follower_id', targetUserId);

                setFollowersCount(followers || 0);
                setFollowingCount(following || 0);

                // 3. Check if I am following them (only if logged in and not me)
                if (currentUser && !isMe) {
                    const { data: followData } = await supabase
                        .from('follows')
                        .select('*')
                        .eq('follower_id', currentUser.id)
                        .eq('following_id', targetUserId)
                        .maybeSingle();

                    setIsFollowing(!!followData);
                }

            } catch (error) {
                console.error("Error fetching profile data:", error);
            }
        };

        fetchData();

        // Realtime Subscription for Counts
        const channel = supabase
            .channel(`profile-follows-${targetUserId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'follows'
            }, () => {
                // Simplified: just refetch counts for now
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [targetUserId, currentUser, isMe]);

    // Fetch User's Posts
    useEffect(() => {
        if (!targetUserId) return;

        const fetchPosts = async () => {
            setLoadingPosts(true);
            const { data } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false });

            setPosts(data || []);
            setLoadingPosts(false);
        };

        fetchPosts();

        // Subscribe to new posts
        const channel = supabase
            .channel(`profile-posts-${targetUserId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `user_id=eq.${targetUserId}` },
                () => fetchPosts()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [targetUserId]);

    const handleFollow = async () => {
        if (!currentUser || !targetUserId || followLoading) return;
        setFollowLoading(true);

        try {
            if (isFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', currentUser.id)
                    .eq('following_id', targetUserId);

                if (error) throw error;
                setIsFollowing(false);
                setFollowersCount(prev => Math.max(0, prev - 1));
            } else {
                // Follow
                const { error } = await supabase
                    .from('follows')
                    .insert({
                        follower_id: currentUser.id,
                        following_id: targetUserId
                    });

                if (error) throw error;
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
            }
        } catch (error) {
            console.error("Follow action failed:", error);
            alert("Failed to update follow status. Make sure you ran the SQL script!");
        } finally {
            setFollowLoading(false);
        }
    };

    // Loading State
    if (authLoading && !profileData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Display Data
    const displayUser = {
        name: profileData?.name || (isMe ? currentUser?.name : "User"),
        avatar: profileData?.avatar || (isMe ? currentUser?.avatar : "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"),
        bio: profileData?.bio || "No bio yet.",
        location: profileData?.location || "Earth"
    };

    return (
        <div className="pb-24 bg-[#F8F9FA] min-h-screen">
            {/* Cover Image */}
            <div className="h-64 bg-gray-200 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-0"></div>
                <img src={displayUser.avatar} className="w-full h-full object-cover blur-sm opacity-50" alt="Cover" />
                {isMe && (
                    <Link href="/settings" className="absolute top-6 right-6 bg-white/20 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white/30 transition-colors z-10">
                        <Settings className="w-5 h-5" />
                    </Link>
                )}
            </div>

            {/* Profile Info */}
            <div className="px-6 relative -mt-24 z-10 pb-10">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 mb-4">
                        <img src={displayUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">{displayUser.name}</h1>
                    <p className="text-gray-500 text-center text-sm mt-1 max-w-xs ">{displayUser.bio}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mt-4 mb-6">
                        <div className="text-center">
                            <span className="block font-bold text-xl text-gray-900">{followersCount}</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Followers</span>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-xl text-gray-900">{followingCount}</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Following</span>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-xl text-gray-900">{posts.length}</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Posts</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {isMe ? (
                            <Link href="/profile/edit">
                                <button className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:bg-gray-800 transition-all">
                                    Edit Profile
                                </button>
                            </Link>
                        ) : (
                            <>
                                <button
                                    onClick={handleFollow}
                                    disabled={followLoading}
                                    className={`px-8 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all ${isFollowing
                                        ? 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
                                        : 'bg-black text-white hover:bg-gray-800'
                                        }`}
                                >
                                    {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isFollowing ? "Unfollow" : "Follow")}
                                </button>
                                <button
                                    onClick={() => router.push(`/chat?user=${targetUserId}`)}
                                    className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Message
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Highlights Bar */}
                <div className="mb-6">
                    <HighlightsBar userId={targetUserId!} isMe={isMe} />
                </div>

                {/* Posts Feed for User */}
                <div className="flex items-center justify-between mb-4 px-2 mt-8">
                    <h2 className="text-lg font-bold text-gray-900">Latest Posts</h2>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Create Post Widget (Only for me) */}
                    {isMe && (
                        <div className="mb-2">
                            <CreatePost />
                        </div>
                    )}

                    {loadingPosts ? (
                        <div className="p-12 text-center text-gray-400">Loading posts...</div>
                    ) : posts.length === 0 ? (
                        <div className="text-center text-gray-400 py-12 bg-white rounded-3xl border border-gray-100">
                            No posts yet.
                        </div>
                    ) : (
                        posts.map((post) => (
                            <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                {post.image_url && (
                                    <div className="relative w-full bg-gray-100">
                                        <img src={post.image_url} alt="Post" className="w-full object-contain max-h-[500px]" />
                                    </div>
                                )}
                                <div className="p-5">
                                    <p className="text-gray-900 mb-3 leading-relaxed">{post.content}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500 fill-red-500" /> {post.likes_count}</span>
                                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
