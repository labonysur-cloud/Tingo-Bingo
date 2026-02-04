"use client";

import { useAuth } from "@/context/AuthContext";
import { useSocial } from "@/context/SocialContext";
import { useChat } from "@/context/ChatContext";
import { Heart, MessageCircle, Plus, Send, Sparkles, Gamepad2, MessageSquare, LayoutGrid, Search, Trash2, RefreshCw, Play, Pause, Menu } from "lucide-react";
import SideMenu from "../navigation/SideMenu";
import { formatDistanceToNow } from "date-fns";



import CreatePost from "./CreatePost";
import AddStoryModal from "../stories/AddStoryModal";
import StoryViewer from "../stories/StoryViewer";
import LikeButton from "../ui/LikeButton";
import SaveButton from "../ui/SaveButton";
import NotificationBell from "../notifications/NotificationBell";
import CommentItem from "./CommentItem";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

// Minimal Reel Item Component for Feed
function FeedReelItem({ reel, user }: { reel: any, user: any }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const router = useRouter();

    const togglePlay = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                    })
                    .catch((error) => {
                        console.error("Video play failed:", error);
                        // Optional: Show toast or ignore (e.g. abort error)
                        setIsPlaying(false);
                    });
            }
        }
    }

    return (
        <div
            className="relative w-full bg-black rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/50 group cursor-pointer border border-gray-100/10"
            onClick={() => router.push(`/reels?id=${reel.id}`)}
        >
            {/* Video - Intrinsic Height */}
            <video
                ref={videoRef}
                src={reel.video_url}
                poster={reel.thumbnail_url}
                className="w-full h-auto block object-contain max-h-[85vh] bg-gray-900"
                loop
                muted
                playsInline
            />

            {/* Dark Gradient Overlay - Full Cover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none transition-opacity duration-300" />

            {/* Top Badge */}
            <div className="absolute top-5 left-5 right-5 flex justify-between items-start z-20 pointer-events-auto">
                <Link href={`/profile/${reel.user_id}`} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/10 hover:bg-black/50 transition-colors">
                        <div className="w-8 h-8 rounded-full border border-white/20 p-0.5">
                            <img src={reel.user?.avatar_url || "/default-avatar.png"} alt={reel.user?.username} className="w-full h-full rounded-full object-cover" />
                        </div>
                        <span className="font-bold text-white text-xs pr-2">{reel.user?.username || "Unknown"}</span>
                    </div>
                </Link>

                <div className="bg-orange-500/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg shadow-orange-500/20">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                        <Play className="w-3 h-3 fill-current" />
                        Tangii
                    </span>
                </div>
            </div>

            {/* Center Play Button Interaction Area - Only the button captures clicks, container passes through */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div
                    onClick={(e) => { e.stopPropagation(); togglePlay(e); }}
                    className={`
                        w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center cursor-pointer pointer-events-auto
                        transition-all duration-300 transform hover:scale-110 active:scale-95
                        ${isPlaying ? 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100' : 'opacity-100 scale-100'}
                    `}
                >
                    {isPlaying ? <Pause className="w-6 h-6 text-white fill-white" /> : <Play className="w-6 h-6 text-white fill-white ml-1" />}
                </div>
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-20 pointer-events-none">
                <p className="text-white text-base font-medium line-clamp-3 mb-4 drop-shadow-md leading-relaxed">
                    {reel.caption}
                </p>

                <div className="flex items-center gap-3 pointer-events-auto">
                    <button
                        className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-white hover:text-gray-900 transition-all flex items-center justify-center gap-2 group/btn"
                        onClick={(e) => { e.stopPropagation(); router.push(`/reels?id=${reel.id}`); }}
                    >
                        Watch Full Tangii
                        <Sparkles className="w-4 h-4 text-orange-400 group-hover/btn:text-orange-500" />
                    </button>

                    <div className="flex gap-2">
                        <div className="w-10 h-10 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90">
                            <Heart className="w-5 h-5" />
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function FeedView() {
    const { user } = useAuth();
    const { posts, addPost, likePost, savePost, addComment, likeComment, deletePost, stories, refreshFeed } = useSocial();
    const { startConversation } = useChat();
    const router = useRouter();

    const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
    const [commentText, setCommentText] = useState<{ [key: string]: string | undefined }>({});
    const [isAddingStory, setIsAddingStory] = useState(false);
    const [viewingStories, setViewingStories] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Tangii State
    const [reels, setReels] = useState<any[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        fetchReels();
    }, []);

    const fetchReels = async () => {
        const { data } = await supabase
            .from('reels')
            .select(`*, user:users(username, avatar_url:avatar)`) // Ensure alias matches usage
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) {
            const formatted = data.map(r => ({
                ...r,
                type: 'reel',
                createdAt: r.created_at // Normalize for sorting
            }));
            setReels(formatted);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([refreshFeed(), fetchReels()]);
        setTimeout(() => setIsRefreshing(false), 500);
    };

    // Merge Posts and Reels
    const feedItems = [
        ...posts.map(p => ({ ...p, type: 'post' })),
        ...reels
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


    // Group stories by user
    const storiesByUser = (stories || []).reduce((acc, story) => {
        if (!acc[story.userId]) {
            acc[story.userId] = [];
        }
        acc[story.userId].push(story);
        return acc;
    }, {} as Record<string, typeof stories>);

    const storyUsers = Object.keys(storiesByUser).filter(id => id !== user?.id);
    const myStories = user ? storiesByUser[user.id] : [];

    const startChat = async (otherUserId: string, otherUserName: string) => {
        if (!user || otherUserId === user.id) return;
        try {
            const chatId = await startConversation(otherUserId);
            router.push(`/chat?user=${otherUserId}`);
        } catch (error) {
            console.error("Failed to start chat", error);
        }
    };

    return (
        <main className="pb-24 bg-gray-50 min-h-screen">
            {/* Simple Header */}
            <header className="sticky top-0 bg-white border-b border-gray-200 z-50 px-4 py-3 shadow-sm">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="TingoBingo" className="w-10 h-10 rounded-xl" />
                        <h1 className="text-xl font-bold text-gray-900">TingoBingo</h1>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push('/search')}
                            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                            <Search className="w-5 h-5 text-gray-600" />
                        </button>

                        {/* Notification Bell */}
                        <NotificationBell />

                        <Link href="/profile" className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden block hover:opacity-80 transition-opacity">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"} alt="Profile" className="w-full h-full object-cover" />
                        </Link>

                        {/* Menu Toggle - Moved to right */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                            <Menu className="w-6 h-6 text-gray-700" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Stories Bar */}
            <div className="flex gap-4 p-4 overflow-x-auto no-scrollbar border-b border-gray-100 bg-white shadow-sm z-40 relative">
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


            {/* Create Post Widget */}
            <div className="p-4">
                <CreatePost />
            </div>

            {/* Feature Banners REMOVED - Moved to SideMenu */}

            {/* Feed Stream */}
            <div className="flex flex-col gap-6 px-4 pb-4">
                {feedItems.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <p>No posts yet. Be the first!</p>
                    </div>
                ) : (
                    feedItems.map((item: any) => {
                        // Render Tangii Reel
                        if (item.type === 'reel') {
                            return <FeedReelItem key={`reel-${item.id}`} reel={item} user={user} />;
                        }

                        // Render Standard Post
                        const post = item;
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
                                            <p className="text-xs text-gray-400">
                                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                            </p>
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
                                    <SaveButton
                                        isSaved={post.isSavedByMe || false}
                                        onClick={() => savePost(post.id)}
                                        size="md"
                                    />
                                    {/* Delete Button - Only for Post Owner */}
                                    {user && post.userId === user.id && (
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this post?')) {
                                                    deletePost(post.id);
                                                }
                                            }}
                                            className="ml-auto flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete post"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {/* Comments Section - Toggleable */}
                                {showComments[post.id] && (
                                    <div className="border-t border-gray-100 bg-gray-50 animate-in slide-in-from-top-2 duration-300">
                                        {/* Existing Comments */}
                                        {post.comments && post.comments.length > 0 && (
                                            <div className="px-4 py-3 max-h-96 overflow-y-auto space-y-3">
                                                {post.comments.map((comment: any) => (
                                                    <CommentItem
                                                        key={comment.id}
                                                        comment={comment}
                                                        postId={post.id}
                                                        onReply={(commentId, parentName) => {
                                                            // Set comment text with @mention
                                                            setCommentText({
                                                                ...commentText,
                                                                [post.id]: `@${parentName} `,
                                                                [`${post.id}_replyTo`]: commentId
                                                            });
                                                        }}
                                                        onLike={(commentId, postId) => {
                                                            likeComment(commentId, postId);
                                                        }}
                                                    />
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
                                                                const replyToId = commentText[`${post.id}_replyTo`] as string | undefined;
                                                                addComment(post.id, commentText[post.id] ?? "", replyToId);
                                                                setCommentText({
                                                                    ...commentText,
                                                                    [post.id]: "",
                                                                    [`${post.id}_replyTo`]: undefined
                                                                });
                                                            }
                                                        }}
                                                        className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (commentText[post.id]?.trim()) {
                                                                const replyToId = commentText[`${post.id}_replyTo`];
                                                                addComment(post.id, commentText[post.id] ?? "", replyToId);
                                                                setCommentText({
                                                                    ...commentText,
                                                                    [post.id]: "",
                                                                    [`${post.id}_replyTo`]: undefined
                                                                });
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
            {/* Side Menu */}
            <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </main >
    );
}
