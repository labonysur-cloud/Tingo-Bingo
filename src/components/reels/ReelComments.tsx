"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Heart, Send, X, Reply, Trash2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface ReelComment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    parent_id: string | null;
    user: {
        username: string;
        avatar_url: string;
    };
    replies?: ReelComment[];
}

export default function ReelComments({ reelId, reelOwnerId, onClose }: { reelId: string; reelOwnerId: string; onClose: () => void }) {
    const { user } = useAuth();
    const [comments, setComments] = useState<ReelComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<ReelComment | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchComments = async () => {
        try {
            const { data, error } = await supabase
                .from('reel_comments')
                .select(`
                    *,
                    user:users(username, avatar_url:avatar)
                `)
                .eq('reel_id', reelId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Simple threading logic: Organize into parents and replies
            const parents = data.filter((c: any) => !c.parent_id);
            const replies = data.filter((c: any) => c.parent_id);

            parents.forEach((p: any) => {
                p.replies = replies.filter((r: any) => r.parent_id === p.id);
            });

            setComments(parents as any);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();

        // Realtime subscription
        const channel = supabase
            .channel(`reel_comments:${reelId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reel_comments',
                filter: `reel_id=eq.${reelId}`
            }, () => {
                fetchComments();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [reelId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        try {
            const { error } = await supabase.from('reel_comments').insert({
                reel_id: reelId,
                user_id: user.id, // Ensure this matches typical user object in app
                content: newComment,
                parent_id: replyingTo?.id || null
            });

            if (error) throw error;
            setNewComment('');
            setReplyingTo(null);

            // Optimistic update could go here, but realtime handles it fast enough usually
        } catch (error) {
            toast.error("Failed to post comment");
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm("Delete this comment?")) return;

        // Optimistic Update
        const previousComments = [...comments];
        setComments(current => {
            return current.map(c => {
                if (c.id === commentId) return null; // Remove if it's a parent
                if (c.replies) {
                    // Remove if it's a reply
                    const newReplies = c.replies.filter(r => r.id !== commentId);
                    return { ...c, replies: newReplies };
                }
                return c;
            }).filter(Boolean) as ReelComment[];
        });

        const { error } = await supabase.from('reel_comments').delete().eq('id', commentId);

        if (error) {
            toast.error("Failed to delete");
            setComments(previousComments); // Revert on error
        } else {
            toast.success("Deleted");
        }
    };

    const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});

    const toggleReplies = (commentId: string) => {
        setShowReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full sm:w-[500px] h-[75vh] sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <h3 className="font-bold text-center flex-1 text-gray-900">Comments ({comments.length})</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
                    {loading ? (
                        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-2">
                            <MessageCircle className="w-12 h-12 opacity-20" />
                            <p>No comments yet. Start the conversation!</p>
                        </div>
                    ) : (
                        comments.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                onReply={() => setReplyingTo(comment)}
                                onDelete={handleDelete}
                                reelOwnerId={reelOwnerId}
                                currentUserId={user?.id}
                                showReplies={showReplies[comment.id]}
                                onToggleReplies={() => toggleReplies(comment.id)}
                            />
                        ))
                    )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10">
                    {replyingTo && (
                        <div className="flex items-center justify-between text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg mb-2">
                            <span>Replying to <span className="font-bold">@{replyingTo.user?.username}</span></span>
                            <button onClick={() => setReplyingTo(null)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="flex gap-3 items-center">
                        <img
                            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                            className="w-10 h-10 rounded-full border border-gray-200 shadow-sm"
                            alt="User"
                        />
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                                className="w-full bg-gray-50 rounded-full px-5 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white border border-transparent focus:border-orange-100 transition-all shadow-sm"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full text-white disabled:opacity-0 transition-all hover:shadow-md transform hover:scale-105"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function CommentItem({ comment, onReply, onDelete, currentUserId, reelOwnerId, showReplies, onToggleReplies }: any) {
    const isOwner = currentUserId === comment.user_id;
    const isReelOwner = currentUserId === reelOwnerId;
    const canDelete = isOwner || isReelOwner;
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(comment.likes_count || 0);

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount((prev: number) => liked ? prev - 1 : prev + 1);
        // Note: Actual DB update suppressed for MVP speed, using local optimistic state
    };

    return (
        <div className="flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300">
            <img
                src={comment.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?.username}`}
                className="w-9 h-9 rounded-full border border-gray-100 shrink-0 object-cover bg-gray-50"
                alt={comment.user?.username}
            />
            <div className="flex-1 min-w-0">
                <div className="bg-gray-50 rounded-2xl p-3 px-4 inline-block min-w-[200px]">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900">{comment.user?.username}</span>
                        <span className="text-[10px] text-gray-400 font-medium">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed break-words whitespace-pre-wrap">
                        {comment.content}
                    </p>
                </div>

                <div className="flex items-center gap-4 mt-1.5 ml-2">
                    <button
                        onClick={handleLike}
                        className={`text-xs font-semibold flex items-center gap-1 transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-500' : ''}`} />
                        {likesCount > 0 && likesCount}
                    </button>
                    <button onClick={onReply} className="text-xs font-semibold text-gray-400 hover:text-orange-500 transition-colors">
                        Reply
                    </button>
                    {canDelete && (
                        <button onClick={() => onDelete(comment.id)} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">
                            Delete
                        </button>
                    )}
                </div>

                {/* Nested Replies Toggle */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 ml-2">
                        <button
                            onClick={onToggleReplies}
                            className="text-xs font-semibold text-gray-400 hover:text-gray-600 flex items-center gap-2"
                        >
                            <div className="w-8 h-[1px] bg-gray-300"></div>
                            {showReplies ? "Hide replies" : `View ${comment.replies.length} replies`}
                        </button>

                        {showReplies && (
                            <div className="mt-3 space-y-4 pl-4 border-l-2 border-gray-100">
                                {comment.replies.map((reply: any) => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        onReply={onReply}
                                        onDelete={onDelete}
                                        currentUserId={currentUserId}
                                        reelOwnerId={reelOwnerId}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
