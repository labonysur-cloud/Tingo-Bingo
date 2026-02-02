"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocial } from "@/context/SocialContext";
import { Bookmark, Heart, MessageCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import LikeButton from "../ui/LikeButton";
import SaveButton from "../ui/SaveButton";

export default function Moodboard() {
    const { user } = useAuth();
    const { getSavedPosts, savePost, likePost } = useSocial();
    const router = useRouter();

    const [savedPosts, setSavedPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSavedPosts();
    }, []);

    const loadSavedPosts = async () => {
        setLoading(true);
        const posts = await getSavedPosts();
        setSavedPosts(posts);
        setLoading(false);
    };

    const handleUnsave = async (postId: string) => {
        await savePost(postId);
        // Reload saved posts after unsaving
        loadSavedPosts();
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
                    {savedPosts.length} saved {savedPosts.length === 1 ? 'post' : 'posts'}
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
            ) : savedPosts.length === 0 ? (
                /* Empty State */
                <div className="max-w-md mx-auto text-center py-20">
                    <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Bookmark className="w-16 h-16 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">No saved posts yet</h2>
                    <p className="text-gray-600 mb-6">
                        Start saving posts you love by clicking the bookmark icon!
                    </p>
                    <button
                        onClick={() => router.push('/feed')}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition-all"
                    >
                        Explore Feed
                    </button>
                </div>
            ) : (
                /* Masonry Grid */
                <div className="max-w-7xl mx-auto">
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {savedPosts.map((post) => (
                            <div
                                key={post.id}
                                className="break-inside-avoid bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-shadow duration-300"
                            >
                                {/* Post Image */}
                                {post.image && (
                                    <div className="relative">
                                        <img
                                            src={post.image}
                                            alt="Post"
                                            className="w-full object-cover"
                                        />
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                            <button
                                                onClick={() => router.push(`/feed`)}
                                                className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors"
                                            >
                                                View Post
                                            </button>
                                            <button
                                                onClick={() => handleUnsave(post.id)}
                                                className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors"
                                                title="Remove from Moodboard"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Post Content */}
                                <div className="p-5">
                                    {/* User Info */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <img
                                            src={post.userAvatar}
                                            alt={post.userName}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900">{post.userName}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(post.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Caption */}
                                    {post.caption && (
                                        <p className="text-gray-700 mb-3 line-clamp-3">
                                            {post.caption}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                                        <LikeButton
                                            isLiked={post.isLikedByMe || false}
                                            likesCount={post.likesCount || 0}
                                            onClick={() => likePost(post.id)}
                                            size="sm"
                                        />
                                        <div className="flex items-center gap-1.5 text-gray-500">
                                            <MessageCircle className="w-5 h-5" />
                                            <span className="font-bold text-sm">{post.commentsCount || 0}</span>
                                        </div>
                                        <SaveButton
                                            isSaved={true}
                                            onClick={() => handleUnsave(post.id)}
                                            size="sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
