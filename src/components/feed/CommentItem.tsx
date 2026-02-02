"use client";

import { Comment } from "@/context/SocialContext";
import { Heart, Reply } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface CommentItemProps {
    comment: Comment;
    onReply: (commentId: string, parentName: string) => void;
    onLike?: (commentId: string) => void;
    depth?: number; // Track nesting depth
}

export default function CommentItem({ comment, onReply, onLike, depth = 0 }: CommentItemProps) {
    const [showReplies, setShowReplies] = useState(true);
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
        <div className={`flex gap-2 ${depth > 0 ? 'ml-10 mt-2' : ''}`}>
            {/* Avatar */}
            <Link href={`/profile/${comment.userId}`}>
                <img
                    src={comment.userAvatar}
                    alt={comment.userName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 hover:opacity-80 transition-opacity"
                />
            </Link>

            {/* Comment Content */}
            <div className="flex-1">
                <div className="bg-white rounded-2xl px-3 py-2 shadow-sm">
                    <Link href={`/profile/${comment.userId}`}>
                        <p className="font-bold text-sm text-gray-900 hover:underline">{comment.userName}</p>
                    </Link>
                    <p className="text-gray-700 text-sm mt-0.5">{comment.text}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-1 ml-3">
                    <button
                        onClick={() => onReply(comment.id, comment.userName)}
                        className="text-xs font-semibold text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
                    >
                        <Reply className="w-3 h-3" />
                        Reply
                    </button>
                    {hasReplies && (
                        <button
                            onClick={() => setShowReplies(!showReplies)}
                            className="text-xs font-semibold text-gray-500 hover:text-primary transition-colors"
                        >
                            {showReplies ? 'Hide' : 'Show'} {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                        </button>
                    )}
                    <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                </div>

                {/* Nested Replies */}
                {hasReplies && showReplies && (
                    <div className="mt-2">
                        {comment.replies!.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
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
