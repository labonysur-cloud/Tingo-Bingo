"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocial } from "@/context/SocialContext";
import { Bookmark, Heart, MessageCircle, X, Play, Pause } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LikeButton from "../ui/LikeButton";
import SaveButton from "../ui/SaveButton";
import toast from "react-hot-toast";

type SavedItem = {
    id: string;
    type: 'post' | 'reel';
    image?: string;
    video?: string;
    caption?: string;
    userAvatar?: string;
    userName?: string;
    createdAt: string;
    likesCount?: number;
    commentsCount?: number;
    isLikedByMe?: boolean;
    // Reel specific
    reelId?: string;
};

export default function Moodboard() {
    const { user } = useAuth();
    const { getSavedPosts, savePost, likePost } = useSocial();
    const router = useRouter();

    const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSavedItems();
    }, [user]);

    const loadSavedItems = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Fetch Saved Posts (using Context)
            const posts = await getSavedPosts();
            const normalizePosts = posts.map(p => ({
                ...p,
                type: 'post' as const,
                image: p.image,
                createdAt: p.createdAt,
                // Ensure other fields map correctly if needed
            }));

            // 2. Fetch Saved Reels (Direct Supabase)
            const { data: savedReels, error } = await supabase
                .from('reel_saves')
                .select(`
                    created_at,
                    reel:reels (
                        id,
                        video_url,
                        thumbnail_url,
                        caption,
                        likes_count,
                        comments_count,
                        user:users (username, avatar_url:avatar)
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;

            const normalizeReels = (savedReels || []).map((item: any) => ({
                id: item.reel.id,
                type: 'reel' as const,
                image: item.reel.thumbnail_url || item.reel.video_url, // Fallback
                video: item.reel.video_url,
                caption: item.reel.caption,
                userAvatar: item.reel.user?.avatar_url || '/default-avatar.png',
                userName: item.reel.user?.username || 'Unknown',
                createdAt: item.created_at, // Use save time for sorting? Or reel creation time? Usually save time.
                likesCount: item.reel.likes_count,
                commentsCount: item.reel.comments_count,
                isLikedByMe: false // Not fetching this specifically here for efficiency, can add if needed
            }));

            // 3. Merge and Sort
            const combined = [...normalizePosts, ...normalizeReels].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setSavedItems(combined);

        } catch (error) {
            console.error("Error loading moodboard:", error);
            toast.error("Failed to load moodboard");
        } finally {
            setLoading(false);
        }
    };

    const handleUnsave = async (item: SavedItem) => {
        if (item.type === 'post') {
            await savePost(item.id);
        } else {
            // Unsave Reel directly
            const { error } = await supabase
                .from('reel_saves')
                .delete()
                .eq('reel_id', item.id)
                .eq('user_id', user?.id);
            if (error) {
                toast.error("Failed to unsave reel");
                return;
            }
            toast.success("Reel removed from Moodboard");
        }
        // Reload
        // Optimistic update locally
        setSavedItems(prev => prev.filter(i => i.id !== item.id));
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
                <div className="text-center">
                    <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Please log in to view your mood board</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8 px-4">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl">
                        <Bookmark className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900">My Moodboard</h1>
                </div>
                <p className="text-gray-600 ml-[60px]">
                    {savedItems.length} saved {savedItems.length === 1 ? 'item' : 'items'}
                </p>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-3xl h-96 animate-pulse" />
                        ))}
                    </div>
                </div>
            ) : savedItems.length === 0 ? (
                /* Empty State */
                <div className="max-w-md mx-auto text-center py-20">
                    <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Bookmark className="w-16 h-16 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">No saved items yet</h2>
                    <p className="text-gray-600 mb-6">
                        Start saving posts and Tangii videos you love!
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition-all"
                    >
                        Explore Feed
                    </button>
                    <button
                        onClick={() => router.push('/reels')}
                        className="mt-4 block mx-auto text-purple-600 font-bold hover:underline"
                    >
                        Watch Tangii
                    </button>
                </div>
            ) : (
                /* Masonry Grid */
                <div className="max-w-7xl mx-auto">
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {savedItems.map((item) => (
                            <MoodboardItem
                                key={`${item.type}-${item.id}`}
                                item={item}
                                onUnsave={() => handleUnsave(item)}
                                onLike={() => likePost(item.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function MoodboardItem({ item, onUnsave, onLike }: { item: SavedItem, onUnsave: () => void, onLike: () => void }) {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="break-inside-avoid bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-shadow duration-300">
            {/* Media (Image or Video) */}
            <div className="relative">
                {item.type === 'reel' ? (
                    <div className="relative aspect-[9/16] bg-black">
                        <video
                            ref={videoRef}
                            src={item.video}
                            className="w-full h-full object-cover cursor-pointer"
                            poster={item.image}
                            muted
                            playsInline
                            loop
                            onClick={togglePlay}
                        />
                        {/* Center Play Button (Visible when paused) */}
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div className="bg-black/40 p-4 rounded-full backdrop-blur-sm border border-white/20">
                                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                                </div>
                            </div>
                        )}

                        {/* Corner Stop/Pause Button (Visible when playing) */}
                        {isPlaying && (
                            <button
                                onClick={togglePlay}
                                className="absolute top-3 left-3 bg-black/60 p-2 rounded-full backdrop-blur-sm z-30 hover:bg-black/80 transition-colors"
                            >
                                <Pause className="w-4 h-4 text-white fill-white" />
                            </button>
                        )}


                        {/* Overlay Controls */}
                        <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center gap-4 z-20 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {/* Only show "Watch" if NOT playing or on hover while playing */}
                            {(!isPlaying || isPlaying) && (
                                <>
                                    <button
                                        onClick={() => router.push(`/reels?id=${item.id}`)}
                                        className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors"
                                    >
                                        Watch
                                    </button>
                                </>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); onUnsave(); }}
                                className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors absolute top-3 right-3"
                                title="Remove from Moodboard"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    item.image && (
                        <>
                            <img
                                src={item.image}
                                alt="Post"
                                className="w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button
                                    onClick={() => router.push(`/`)}
                                    className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors"
                                >
                                    View Post
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUnsave(); }}
                                    className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors"
                                    title="Remove from Moodboard"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </>
                    )
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-3">
                    <img
                        src={item.userAvatar}
                        alt={item.userName}
                        className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                        <p className="font-bold text-gray-900">{item.userName}</p>
                        <p className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Caption */}
                {item.caption && (
                    <p className="text-gray-700 mb-3 line-clamp-3">
                        {item.caption}
                    </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                    {item.type === 'post' ? (
                        <LikeButton
                            isLiked={item.isLikedByMe || false}
                            likesCount={item.likesCount || 0}
                            onClick={onLike}
                            size="sm"
                        />
                    ) : (
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <Heart className="w-5 h-5" />
                            <span className="font-bold text-sm">{item.likesCount || 0}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 text-gray-500">
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-bold text-sm">{item.commentsCount || 0}</span>
                    </div>

                    <SaveButton
                        isSaved={true}
                        onClick={onUnsave}
                        size="sm"
                    />
                </div>
            </div>
        </div>
    );
}
