"use client";

import { Comment } from "@/context/SocialContext";
import { Heart, Reply, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface CommentItemProps {
    comment: Comment;
    postId: string;
    onReply: (commentId: string, parentName: string) => void;
    onLike: (commentId: string, postId: string) => void;
    depth?: number; // Track nesting depth
}

export default function CommentItem({ comment, postId, onReply, onLike, depth = 0 }: CommentItemProps) {
    const [showReplies, setShowReplies] = useState(false); // Default to collapsed
    const hasReplies = comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0;

    return (
        <div className={`flex gap-2 ${depth > 0 ? 'ml-8 mt-2' : 'mt-3'}`}>
            {/* Avatar */}
            <Link href={`/profile/${comment.userId}`}>
                <img
                    src={comment.userAvatar}
                    alt={comment.userName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 hover:opacity-80 transition-opacity"
                />
            </Link>

            {/* Comment Content */}
            <div className="flex-1 min-w-0">
                <div className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-2xl px-4 py-2.5 shadow-sm border border-gray-100">
                    <Link href={`/profile/${comment.userId}`}>
                        <p className="font-bold text-sm text-gray-900 hover:underline">{comment.userName}</p>
                    </Link>
                    <p className="text-gray-700 text-sm mt-0.5 break-words">{comment.text}</p>
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-4 mt-1.5 ml-3">
                    {/* Like Button */}
                    <button
                        onClick={() => onLike(comment.id, postId)}
                        className="flex items-center gap-1 text-xs font-semibold hover:scale-105 transition-transform"
                    >
                        <Heart
                            className={`w-3.5 h-3.5 ${comment.isLikedByMe ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
                        />
                        {comment.likes_count! > 0 && (
                            <span className={comment.isLikedByMe ? 'text-red-500' : 'text-gray-500'}>
                                {comment.likes_count}
                            </span>
                        )}
                    </button>

                    {/* Reply Button */}
                    <button
                        onClick={() => onReply(comment.id, comment.userName)}
                        className="text-xs font-semibold text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
                    >
                        <Reply className="w-3 h-3" />
                        Reply
                    </button>

                    {/* Show/Hide Replies Button */}
                    {hasReplies && (
                        <button
                            onClick={() => setShowReplies(!showReplies)}
                            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                        >
                            {showReplies ? (
                                <>
                                    <ChevronUp className="w-3 h-3" />
                                    Hide {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-3 h-3" />
                                    Show {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                                </>
                            )}
                        </button>
                    )}

                    {/* Timestamp */}
                    <span className="text-xs text-gray-400 ml-auto">
                        {new Date(comment.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                        })}
                    </span>
                </div>

                {/* Nested Replies */}
                {hasReplies && showReplies && (
                    <div className="mt-2 border-l-2 border-gray-200 pl-2">
                        {comment.replies!.filter((reply: any) => reply != null).map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                postId={postId}
                                onReply={onReply}
                                onLike={onLike}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
