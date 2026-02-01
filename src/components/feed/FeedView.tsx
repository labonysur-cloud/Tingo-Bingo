"use client";

import { useAuth } from "@/context/AuthContext";
import { useSocial } from "@/context/SocialContext";
import { useChat } from "@/context/ChatContext";
// import { uploadToCloudinary } from "@/lib/cloudinary";  // No longer needed here
import { Heart, MessageCircle, Share2, Plus, Send, Sparkles, Gamepad2, MessageSquare, LayoutGrid, Search } from "lucide-react";
import CreatePost from "./CreatePost";
import AddStoryModal from "../stories/AddStoryModal";
import StoryViewer from "../stories/StoryViewer";
import LikeButton from "../ui/LikeButton";
import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function FeedView() {
    const { user } = useAuth();
    const { posts, addPost, likePost, addComment, stories } = useSocial();
    const { startConversation } = useChat();
    const router = useRouter();

    const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
    const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
    const [isAddingStory, setIsAddingStory] = useState(false);
    const [viewingStories, setViewingStories] = useState<string | null>(null); // userId of stories being viewed

    // Group stories by user
    const storiesByUser = (stories || []).reduce((acc, story) => {
        if (!acc[story.userId]) {
            acc[story.userId] = [];
        }
        acc[story.userId].push(story);
        return acc;
    }, {} as Record<string, typeof stories>);

    // Get unique users with stories (excluding current user if we want separate "Your Story" bubble, but for now mix them or separate)
    // Let's separate "Your Story" logic if needed, but generic list is fine
    const storyUsers = Object.keys(storiesByUser).filter(id => id !== user?.id);
    const myStories = user ? storiesByUser[user.id] : [];



    const startChat = async (otherUserId: string, otherUserName: string) => {
        if (!user || otherUserId === user.id) return;
        try {
            const chatId = await startConversation(otherUserId);
            router.push(`/chat?user=${otherUserId}`); // Or push to dynamic route if you prefer
        } catch (error) {
            console.error("Failed to start chat", error);
        }
    };

    return (
        <main className="pb-24 bg-gray-50 min-h-screen">
            {/* Modern Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10 px-4 py-3 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-sm" />
                    <h1 className="text-xl font-bold tracking-tight text-gray-800">TingoBingo</h1>
                </div>
                <Link href="/profile" className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden p-0.5 shadow-sm block transition-transform active:scale-95">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"} alt="Profile" className="w-full h-full rounded-full object-cover" />
                </Link>
            </header>

            {/* Stories Bar */}
            <div className="flex gap-4 p-4 overflow-x-auto no-scrollbar border-b border-gray-100 bg-white shadow-sm">
                {/* Add Story Button */}
                <div
                    className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                    onClick={() => setIsAddingStory(true)}
                >
                    <div className={`w-16 h-16 rounded-full border-2 border-dashed p-1 flex items-center justify-center transition-colors bg-gray-50 ${myStories?.length ? 'border-primary' : 'border-gray-300 group-hover:border-primary'}`}>
                        {/* If I have stories, show my avatar with a badge? or just the plus? Let's keep it simple: Pulse if active stories, or just generic Add */}
                        <Plus className="w-6 h-6 text-gray-400 group-hover:text-primary" />
                    </div>
                    <span className="text-xs font-medium mt-1 text-gray-500">Add Story</span>
                </div>

                {/* My Story Bubble (if exists) */}
                {myStories && myStories.length > 0 && (
                    <div
                        className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                        onClick={() => setViewingStories(user!.id)}
                    >
                        <div className="w-16 h-16 rounded-full border-2 border-primary p-0.5">
                            <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"} alt="My Story" className="w-full h-full rounded-full object-cover" />
                        </div>
                        <span className="text-xs font-medium mt-1 text-gray-900">Your Story</span>
                    </div>
                )}

                {/* Other Users' Stories */}
                {storyUsers.map(userId => {
                    const userStories = storiesByUser[userId];
                    const storyUser = userStories[0]; // Get user info from first story
                    return (
                        <div
                            key={userId}
                            className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                            onClick={() => setViewingStories(userId)}
                        >
                            <div className="w-16 h-16 rounded-full border-2 border-primary p-0.5">
                                <img src={storyUser.userAvatar} alt={storyUser.userName} className="w-full h-full rounded-full object-cover" />
                            </div>
                            <span className="text-xs font-medium mt-1 text-gray-900 w-16 truncate text-center">{storyUser.userName}</span>
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            {isAddingStory && (
                <AddStoryModal onClose={() => setIsAddingStory(false)} />
            )}

            {viewingStories && (
                <StoryViewer
                    stories={storiesByUser[viewingStories] || []}
                    onClose={() => setViewingStories(null)}
                />
            )}

            {/* Search Bar */}
            <div className="px-4 pt-4">
                <button
                    onClick={() => router.push('/search')}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all shadow-sm"
                >
                    <Search className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-400 text-sm font-medium">Search for friends by name or @username</span>
                </button>
            </div>

            {/* Create Post Widget */}
            <div className="p-4">
                <CreatePost />
            </div>

            {/* Feature Banners */}
            <div className="px-4 grid grid-cols-2 gap-3 mb-6">
                <Link href="/moods">
                    <div className="bg-gradient-to-br from-pink-500 to-rose-400 text-white p-4 rounded-2xl flex flex-col justify-between h-24 shadow-lg hover:transform hover:scale-[1.02] transition-all">
                        <LayoutGrid className="w-6 h-6 text-white mb-auto" />
                        <span className="font-semibold text-sm">Mood Board</span>
                    </div>
                </Link>
                <Link href="/ai">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 rounded-2xl flex flex-col justify-between h-24 shadow-lg hover:transform hover:scale-[1.02] transition-all">
                        <Sparkles className="w-6 h-6 text-accent mb-auto" />
                        <span className="font-semibold text-sm">Zoothopilia AI</span>
                    </div>
                </Link>
                <Link href="/gaming">
                    <div className="bg-gradient-to-br from-accent to-yellow-400 text-gray-900 p-4 rounded-2xl flex flex-col justify-between h-24 shadow-lg hover:transform hover:scale-[1.02] transition-all col-span-2">
                        <div className="flex items-center gap-3">
                            <Gamepad2 className="w-6 h-6 text-gray-800" />
                            <span className="font-semibold text-sm">Pet Arcade & Contests</span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Feed Stream */}
            <div className="flex flex-col gap-6 px-4 pb-4">
                {posts.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <p>No posts yet. Be the first!</p>
                    </div>
                ) : (
                    posts.map((post) => {
                        return (
                            <div key={post.id} className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Post Header */}
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Link href={`/profile/${post.userId}`}>
                                            <div className="w-10 h-10 rounded-full bg-gray-200 border border-white shadow-sm overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                                                <img src={post.userAvatar} alt={post.userName} className="w-full h-full object-cover" />
                                            </div>
                                        </Link>
                                        <div>
                                            <Link href={`/profile/${post.userId}`}>
                                                <h3 className="font-bold text-sm text-gray-900 cursor-pointer hover:underline">{post.userName}</h3>
                                            </Link>
                                            <p className="text-xs text-gray-400">Just now</p>
                                        </div>
                                    </div>

                                    {/* Message Button on Post */}
                                    {user && post.userId !== user.id && (
                                        <button
                                            onClick={() => startChat(post.userId, post.userName)}
                                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                                            title="Message"
                                        >
                                            <MessageSquare className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {/* Post Image */}
                                {post.image && (
                                    <div className="w-full bg-gray-50 relative">
                                        <img src={post.image} alt="Post" className="w-full max-h-[500px] object-contain" />
                                    </div>
                                )}

                                {/* Caption */}
                                <div className={`px-4 ${post.image ? "py-3" : "py-4 text-lg"}`}>
                                    <p className="text-gray-800">{post.caption}</p>
                                </div>

                                {/* Actions */}
                                <div className="p-4 pt-0 flex items-center gap-4 mt-2">
                                    <LikeButton
                                        isLiked={post.isLikedByMe || false}
                                        likesCount={post.likesCount || 0}
                                        onClick={() => likePost(post.id)}
                                        size="md"
                                    />
                                    <button
                                        onClick={() => {
                                            const newShowComments = { ...showComments };
                                            newShowComments[post.id] = !newShowComments[post.id];
                                            setShowComments(newShowComments);
                                        }}
                                        className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors"
                                    >
                                        <MessageCircle className="w-6 h-6" />
                                        <span className="font-bold text-sm">{post.commentsCount || 0}</span>
                                    </button>
                                    <button className="ml-auto text-gray-400 hover:text-gray-600">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Comments Section - Toggleable */}
                                {showComments[post.id] && (
                                    <div className="border-t border-gray-100 bg-gray-50 animate-in slide-in-from-top-2 duration-300">
                                        {/* Existing Comments */}
                                        {post.comments && post.comments.length > 0 && (
                                            <div className="px-4 py-3 max-h-64 overflow-y-auto space-y-3">
                                                {post.comments.map((comment) => (
                                                    <div key={comment.id} className="flex gap-2">
                                                        <Link href={`/profile/${comment.userId}`}>
                                                            <img
                                                                src={comment.userAvatar}
                                                                alt={comment.userName}
                                                                className="w-8 h-8 rounded-full object-cover flex-shrink-0 hover:opacity-80 transition-opacity"
                                                            />
                                                        </Link>
                                                        <div className="flex-1 bg-white rounded-2xl px-3 py-2 shadow-sm">
                                                            <Link href={`/profile/${comment.userId}`}>
                                                                <p className="font-bold text-sm text-gray-900 hover:underline">{comment.userName}</p>
                                                            </Link>
                                                            <p className="text-gray-700 text-sm">{comment.text}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Comment Input */}
                                        <div className="px-4 py-3 border-t border-gray-100">
                                            <div className="flex gap-2">
                                                <img
                                                    src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"}
                                                    alt="You"
                                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                                />
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Write a comment..."
                                                        value={commentText[post.id] || ""}
                                                        onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter' && commentText[post.id]?.trim()) {
                                                                addComment(post.id, commentText[post.id]);
                                                                setCommentText({ ...commentText, [post.id]: "" });
                                                            }
                                                        }}
                                                        className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (commentText[post.id]?.trim()) {
                                                                addComment(post.id, commentText[post.id]);
                                                                setCommentText({ ...commentText, [post.id]: "" });
                                                            }
                                                        }}
                                                        disabled={!commentText[post.id]?.trim()}
                                                        className="bg-primary text-white p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </main >
    );
}
