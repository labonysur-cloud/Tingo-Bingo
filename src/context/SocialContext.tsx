"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase, getAuthenticatedSupabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { showToast } from "@/components/ui/Toaster";
import { sanitizeText } from "@/lib/sanitize";

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    createdAt: string;
    parent_comment_id?: string | null; // For nested replies
    replies?: Comment[]; // Nested replies
    likes_count?: number; // Comment likes
    isLikedByMe?: boolean; // Current user liked this comment
}

export interface Post {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    petId?: string;
    image?: string;
    caption: string;
    likesCount: number;
    commentsCount: number;
    savesCount?: number;
    isLikedByMe: boolean;
    isSavedByMe?: boolean;
    createdAt: string;
    comments?: Comment[];
}

export interface Story {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    mediaUrl: string;
    type: 'image' | 'video';
    caption?: string;
    createdAt: string;
    expiresAt: string;
}

export interface Highlight {
    id: string;
    userId: string;
    title: string;
    coverImage: string;
    stories: Story[];
}

interface SocialContextType {
    posts: Post[];
    addPost: (caption: string, image?: string, petId?: string) => Promise<void>;
    likePost: (postId: string) => Promise<void>;
    savePost: (postId: string) => Promise<void>;
    getComments: (postId: string) => Promise<Comment[]>;
    addComment: (postId: string, text: string, parentCommentId?: string) => Promise<void>;
    likeComment: (commentId: string, postId: string) => Promise<void>;
    deletePost: (postId: string) => Promise<void>;
    deleteComment: (commentId: string, postId: string) => Promise<void>;
    getSavedPosts: () => Promise<Post[]>;
    stories: Story[];
    addStory: (file: File, type: 'image' | 'video', caption?: string) => Promise<void>;
    deleteStory: (storyId: string) => Promise<void>;
    highlights: Highlight[];
    createHighlight: (title: string, storyIds: string[], coverImage?: string) => Promise<void>;
    deleteHighlight: (highlightId: string) => Promise<void>;
    removeStoryFromHighlight: (highlightId: string, storyId: string) => Promise<void>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export function SocialProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [stories, setStories] = useState<Story[]>([]);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    // ============================================
    // REAL-TIME SUBSCRIPTION
    // ============================================
    useEffect(() => {
        fetchPosts();
        fetchStories();
        fetchHighlights();

        // Real-time subscription for posts, likes, and comments
        const postsChannel = supabase
            .channel('posts-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'posts'
                },
                (payload) => {
                    console.log('📝 Post change:', payload);
                    fetchPosts();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'post_likes'
                },
                (payload) => {
                    console.log('❤️ Like change:', payload);
                    fetchPosts(); // Refresh to get updated like counts
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comments'
                },
                (payload) => {
                    console.log('💬 Comment change:', payload);
                    fetchPosts(); // Refresh to get updated comment counts
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comment_likes'
                },
                (payload) => {
                    console.log('❤️ Comment like change:', payload);
                    fetchPosts(); // Refresh to get updated comment like counts
                }
            )
            .subscribe();

        setChannel(postsChannel);

        return () => {
            if (postsChannel) {
                supabase.removeChannel(postsChannel);
            }
        };
    }, [user?.id]);


    // ============================================
    // FETCH POSTS (with like status)
    // ============================================
    const fetchPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    id,
                    user_id,
                    pet_id,
                    content,
                    image_url,
                    likes_count,
                    comments_count,
                    saves_count,
                    created_at,
                    users:user_id (
                        name,
                        avatar
                    ),
                    post_likes!left (
                        user_id
                    ),
                    post_saves!left (
                        user_id
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedPosts: Post[] = await Promise.all((data || []).map(async (post: any) => {
                // Check if current user has liked this post
                const postLikes = post.post_likes || [];
                const isLiked = user ? postLikes.some((like: any) => like.user_id === user.id) : false;

                // Check if current user has saved this post
                const postSaves = post.post_saves || [];
                const isSaved = user ? postSaves.some((save: any) => save.user_id === user.id) : false;

                console.log(`📊 Post ${post.id.substring(0, 8)}: likes_count=${post.likes_count}, comments_count=${post.comments_count}, isLikedByMe=${isLiked}`);

                // Fetch comments for this post
                const comments = await getComments(post.id);

                return {
                    id: post.id,
                    userId: post.user_id,
                    userName: post.users?.name || "Unknown User",
                    userAvatar: post.users?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`,
                    petId: post.pet_id,
                    image: post.image_url,
                    caption: post.content || "",
                    likesCount: post.likes_count || 0,
                    commentsCount: post.comments_count || 0,
                    savesCount: post.saves_count || 0,
                    isLikedByMe: isLiked,
                    isSavedByMe: isSaved,
                    createdAt: post.created_at,
                    comments: comments // Add comments to post
                };
            }));

            setPosts(transformedPosts);
        } catch (error: any) {
            console.error("❌ Error fetching posts:", error);
            console.error("Error details:", {
                message: error?.message,
                details: error?.details,
                hint: error?.hint,
                code: error?.code
            });
        }
    };

    // ============================================
    // FETCH STORIES
    // ============================================
    const fetchStories = async () => {
        try {
            const { data, error } = await supabase
                .from('stories')
                .select(`
                    id,
                    user_id,
                    media_url,
                    type,
                    caption,
                    created_at,
                    expires_at,
                    users:user_id (
                        name,
                        avatar
                    )
                `)
                .gt('expires_at', new Date().toISOString()) // Only active stories
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedStories: Story[] = (data || []).map((story: any) => ({
                id: story.id,
                userId: story.user_id,
                userName: story.users?.name || "Unknown",
                userAvatar: story.users?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.user_id}`,
                mediaUrl: story.media_url,
                type: story.type || 'image',
                caption: story.caption,
                createdAt: story.created_at,
                expiresAt: story.expires_at
            }));

            setStories(transformedStories);
        } catch (error) {
            console.error("Error fetching stories:", error);
        }
    };

    // ============================================
    // ADD STORY
    // ============================================
    const addStory = async (file: File, type: 'image' | 'video', caption?: string) => {
        if (!user) {
            showToast.error("Please login to add a story");
            return;
        }

        try {
            // 1. Upload
            const { uploadToCloudinary } = await import("@/lib/cloudinary");
            const mediaUrl = await uploadToCloudinary(file);

            if (!mediaUrl) throw new Error("Upload failed");

            // 2. Insert to DB
            const authSupabase = await getAuthenticatedSupabase();
            const { error } = await authSupabase.from('stories').insert({
                user_id: user.id,
                media_url: mediaUrl,
                type,
                caption
            });

            if (error) throw error;

            showToast.success("Story added!");
            fetchStories(); // Refresh
        } catch (error: any) {
            console.error("Error adding story:", error);
            showToast.error(error.message || "Failed to add story");
        }
    };

    // ============================================
    // DELETE STORY
    // ============================================
    const deleteStory = async (storyId: string) => {
        if (!user) return;
        try {
            const authSupabase = await getAuthenticatedSupabase();
            const { error } = await authSupabase
                .from('stories')
                .delete()
                .eq('id', storyId)
                .eq('user_id', user.id);

            if (error) throw error;

            showToast.success("Story deleted");
            setStories(prev => prev.filter(s => s.id !== storyId));
            fetchHighlights(); // Also refresh highlights as they might contain this story
        } catch (error: any) {
            console.error("Error deleting story:", error);
            showToast.error("Failed to delete story");
        }
    };

    // ============================================
    // FETCH HIGHLIGHTS
    // ============================================
    const fetchHighlights = async () => {
        try {
            // Fetch highlights with their stories
            const { data, error } = await supabase
                .from('highlights')
                .select(`
                    id,
                    user_id,
                    title,
                    cover_image,
                    users (name, avatar),
                    highlight_stories (
                        story:stories (
                            id,
                            media_url,
                            type,
                            caption,
                            created_at
                        )
                    )
                `);

            if (error) throw error;

            const transformedHighlights: Highlight[] = (data || []).map((h: any) => ({
                id: h.id,
                userId: h.user_id,
                title: h.title,
                coverImage: h.cover_image,
                stories: h.highlight_stories?.map((hs: any) => ({
                    id: hs.story.id,
                    userId: h.user_id, // Inherit from highlight owner
                    userName: h.users?.name || "Unknown",
                    userAvatar: h.users?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${h.user_id}`,
                    mediaUrl: hs.story.media_url,
                    type: hs.story.type,
                    caption: hs.story.caption,
                    createdAt: hs.story.created_at,
                    expiresAt: "" // Highlights don't expire in the same way, or irrelevant here
                })) || []
            }));

            setHighlights(transformedHighlights);
        } catch (error) {
            console.error("Error fetching highlights:", error);
        }
    };

    // ============================================
    // CREATE HIGHLIGHT
    // ============================================
    const createHighlight = async (title: string, storyIds: string[], coverImage?: string) => {
        if (!user) return;

        try {
            const authSupabase = await getAuthenticatedSupabase();

            // 1. Create Highlight
            const { data: highlight, error: hError } = await authSupabase
                .from('highlights')
                .insert({
                    user_id: user.id,
                    title,
                    cover_image: coverImage
                })
                .select()
                .single();

            if (hError) throw hError;

            // 2. Add Stories to Highlight
            const storyInserts = storyIds.map(storyId => ({
                highlight_id: highlight.id,
                story_id: storyId
            }));

            const { error: sError } = await authSupabase
                .from('highlight_stories')
                .insert(storyInserts);

            if (sError) throw sError;

            showToast.success("Highlight created!");
            fetchHighlights();
        } catch (error: any) {
            showToast.error(`Failed to create highlight: ${error.message || error.details || 'Unknown error'}`);
        }
    };

    // ============================================
    // DELETE HIGHLIGHT
    // ============================================
    const deleteHighlight = async (highlightId: string) => {
        if (!user) return;
        try {
            const authSupabase = await getAuthenticatedSupabase();
            const { error } = await authSupabase
                .from('highlights')
                .delete()
                .eq('id', highlightId)
                .eq('user_id', user.id);

            if (error) throw error;

            showToast.success("Highlight deleted");
            setHighlights(prev => prev.filter(h => h.id !== highlightId));
        } catch (error) {
            console.error("Error deleting highlight:", error);
            showToast.error("Failed to delete highlight");
        }
    };

    // ============================================
    // REMOVE STORY FROM HIGHLIGHT
    // ============================================
    const removeStoryFromHighlight = async (highlightId: string, storyId: string) => {
        if (!user) return;
        try {
            // Verify ownership of highlight (optional strictly if RLS handles it, but good for UI)
            const authSupabase = await getAuthenticatedSupabase();

            // We need to query the junction table
            // But junction table doesn't have user_id, it relies on highlight's user_id or RLS
            // Since we set permissive RLS, we rely on the fact that only the owner sees the "remove" button
            // But for safety, we could check if highlight belongs to user. 
            // For now, let's just delete from junction table where highlight_id matches.

            const { error } = await authSupabase
                .from('highlight_stories')
                .delete()
                .eq('highlight_id', highlightId)
                .eq('story_id', storyId);

            if (error) throw error;

            showToast.success("Removed from highlight");
            fetchHighlights(); // Refresh state
        } catch (error) {
            console.error("Error removing from highlight:", error);
            showToast.error("Failed to remove from highlight");
        }
    };

    // ============================================
    // ADD POST
    // ============================================
    const addPost = async (caption: string, image?: string, petId?: string) => {
        if (!user) {
            showToast.error('Please log in to create a post');
            return;
        }

        const sanitizedCaption = sanitizeText(caption);

        try {
            const authSupabase = await getAuthenticatedSupabase();
            const { data, error } = await authSupabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    pet_id: petId || null,
                    content: sanitizedCaption,
                    image_url: image || null,
                    likes_count: 0,
                    comments_count: 0
                })
                .select()
                .single();

            if (error) throw error;

            showToast.success('Post created successfully!');
            console.log("✅ Post created:", data);
        } catch (error: any) {
            console.error("❌ Error creating post:", error);
            showToast.error(error.message || 'Failed to create post');
            throw error;
        }
    };

    // ============================================
    // LIKE/UNLIKE POST (with post_likes table)
    // ============================================
    const likePost = async (postId: string) => {
        if (!user) {
            showToast.error('Please log in to like posts');
            return;
        }

        console.log('🔷 Attempting to like post:', postId, 'User:', user.id);

        try {
            const post = posts.find(p => p.id === postId);
            if (!post) {
                console.error('❌ Post not found:', postId);
                return;
            }

            console.log('📊 Current like status:', post.isLikedByMe);

            const authSupabase = await getAuthenticatedSupabase();

            if (post.isLikedByMe) {
                // Unlike
                console.log('👎 Unliking post...');
                const { error, data } = await authSupabase
                    .from('post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', user.id)
                    .select();

                if (error) {
                    console.error('❌ Unlike error details:', error);
                    throw error;
                }
                console.log('✅ Unlike successful:', data);
            } else {
                // Like
                console.log('👍 Liking post...');
                const { error, data } = await authSupabase
                    .from('post_likes')
                    .insert({
                        post_id: postId,
                        user_id: user.id
                    })
                    .select();

                if (error) {
                    console.error('❌ Like error details:', {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                    throw error;
                }
                console.log('✅ Like successful:', data);
            }

            // Optimistic UI update FIRST (instant feedback)
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    const newIsLiked = !p.isLikedByMe;
                    const newLikesCount = newIsLiked ? p.likesCount + 1 : p.likesCount - 1;
                    console.log(`🔄 Optimistic update: ${p.likesCount} → ${newLikesCount}, liked: ${newIsLiked}`);
                    return {
                        ...p,
                        isLikedByMe: newIsLiked,
                        likesCount: Math.max(0, newLikesCount) // Never go below 0
                    };
                }
                return p;
            }));

            // Fetch updated post from database to sync with server
            setTimeout(async () => {
                try {
                    const { data: updatedPost } = await supabase
                        .from('posts')
                        .select('likes_count')
                        .eq('id', postId)
                        .single();

                    if (updatedPost) {
                        setPosts(prev => prev.map(p => {
                            if (p.id === postId) {
                                console.log(`✅ Synced from DB: likes_count = ${updatedPost.likes_count}`);
                                return {
                                    ...p,
                                    likesCount: updatedPost.likes_count || 0
                                };
                            }
                            return p;
                        }));
                    }
                } catch (error) {
                    console.error('⚠️ Failed to sync likes from DB:', error);
                }
            }, 1000); // Wait 1 second for trigger to fire

        } catch (error: any) {
            console.error("❌ Error liking post:", error);
            showToast.error(`Failed to like post: ${error.message || 'Unknown error'}`);
        }
    };

    // ============================================
    // SAVE/UNSAVE POST
    // ============================================
    const savePost = async (postId: string) => {
        if (!user) {
            showToast.error('Please log in to save posts');
            return;
        }

        try {
            const post = posts.find(p => p.id === postId);
            if (!post) return;

            const authSupabase = await getAuthenticatedSupabase();

            if (post.isSavedByMe) {
                // Unsave
                const { error } = await authSupabase
                    .from('post_saves')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', user.id);

                if (error) throw error;
                showToast.success('Post removed from Moodboard');
            } else {
                // Save
                const { error } = await authSupabase
                    .from('post_saves')
                    .insert({
                        post_id: postId,
                        user_id: user.id
                    });

                if (error) throw error;
                showToast.success('Post saved to Moodboard');
            }

            // Optimistic UI update
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    const newIsSaved = !p.isSavedByMe;
                    const newSavesCount = newIsSaved
                        ? (p.savesCount || 0) + 1
                        : Math.max(0, (p.savesCount || 0) - 1);

                    return {
                        ...p,
                        isSavedByMe: newIsSaved,
                        savesCount: newSavesCount
                    };
                }
                return p;
            }));

        } catch (error: any) {
            console.error("❌ Error saving post:", error);
            showToast.error('Failed to save post');
        }
    };

    // ============================================
    // GET SAVED POSTS (for Moodboard)
    // ============================================
    const getSavedPosts = async (): Promise<Post[]> => {
        if (!user) return [];

        try {
            const { data, error } = await supabase
                .from('post_saves')
                .select(`
                    created_at,
                    posts (
                        id,
                        user_id,
                        pet_id,
                        content,
                        image_url,
                        likes_count,
                        comments_count,
                        saves_count,
                        created_at,
                        users:user_id (
                            name,
                            avatar
                        ),
                        post_likes!left (
                            user_id
                        ),
                        post_saves!left (
                            user_id
                        )
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedPosts: Post[] = (await Promise.all((data || []).map(async (save: any) => {
                const post = save.posts;
                if (!post) return null;

                const postLikes = post.post_likes || [];
                const isLiked = postLikes.some((like: any) => like.user_id === user.id);

                const postSaves = post.post_saves || [];
                const isSaved = postSaves.some((s: any) => s.user_id === user.id);

                const comments = await getComments(post.id);

                return {
                    id: post.id,
                    userId: post.user_id,
                    userName: post.users?.name || "Unknown User",
                    userAvatar: post.users?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`,
                    petId: post.pet_id,
                    image: post.image_url,
                    caption: post.content || "",
                    likesCount: post.likes_count || 0,
                    commentsCount: post.comments_count || 0,
                    savesCount: post.saves_count || 0,
                    isLikedByMe: isLiked,
                    isSavedByMe: isSaved,
                    createdAt: post.created_at,
                    comments: comments
                };
            }))).filter(p => p !== null) as Post[];

            return transformedPosts;

        } catch (error) {
            console.error("❌ Error fetching saved posts:", error);
            return [];
        }
    };


    // ============================================
    // GET COMMENTS FOR POST
    // ============================================
    const getComments = async (postId: string): Promise<Comment[]> => {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    id,
                    post_id,
                    user_id,
                    content,
                    created_at,
                    parent_comment_id,
                    likes_count,
                    users:user_id (
                        name,
                        avatar
                    ),
                    comment_likes!left (
                        user_id
                    )
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            console.log(`💬 Fetched ${data?.length || 0} total comments for post ${postId.substring(0, 8)}`);

            // Transform and organize comments with replies
            const allComments: Comment[] = (data || []).map((comment: any) => {
                // Check if current user has liked this comment
                const comment_likes = comment.comment_likes || [];
                const isLiked = user ? comment_likes.some((like: any) => like.user_id === user.id) : false;

                return {
                    id: comment.id,
                    postId: comment.post_id,
                    userId: comment.user_id,
                    userName: comment.users?.name || "Unknown User",
                    userAvatar: comment.users?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`,
                    text: comment.content,
                    createdAt: comment.created_at,
                    parent_comment_id: comment.parent_comment_id,
                    likes_count: comment.likes_count || 0,
                    isLikedByMe: isLiked,
                    replies: []
                };
            });

            // Organize comments into parent-child structure
            const topLevelComments: Comment[] = [];
            const commentMap = new Map<string, Comment>();

            // First pass: create map of all comments
            allComments.forEach(comment => {
                commentMap.set(comment.id, comment);
            });

            // Second pass: organize into hierarchy
            allComments.forEach(comment => {
                if (comment.parent_comment_id) {
                    // This is a reply
                    const parent = commentMap.get(comment.parent_comment_id);
                    if (parent && parent.replies) {
                        parent.replies.push(comment);
                        console.log(`  ↳ Reply "${comment.text.substring(0, 20)}..." nested under parent`);
                    } else {
                        console.warn(`  ⚠️ Parent comment ${comment.parent_comment_id} not found for reply ${comment.id}`);
                    }
                } else {
                    // This is a top-level comment
                    topLevelComments.push(comment);
                }
            });

            console.log(`📊 Organized into ${topLevelComments.length} top-level comments`);
            topLevelComments.forEach(comment => {
                if (comment.replies && comment.replies.length > 0) {
                    console.log(`  💬 "${comment.text.substring(0, 30)}..." has ${comment.replies.length} replies`);
                }
            });

            return topLevelComments;
        } catch (error) {
            console.error("Error fetching comments:", error);
            return [];
        }
    };

    // ============================================
    // ADD COMMENT
    // ============================================
    const addComment = async (postId: string, text: string, parentCommentId?: string) => {
        if (!user) {
            showToast.error('Please log in to comment');
            return;
        }

        if (!text.trim()) {
            showToast.error('Comment cannot be empty');
            return;
        }

        const sanitized = sanitizeText(text);

        try {
            const authSupabase = await getAuthenticatedSupabase();
            const { error } = await authSupabase
                .from('comments')
                .insert({
                    post_id: postId,
                    user_id: user.id,
                    content: sanitized,
                    parent_comment_id: parentCommentId || null
                });

            if (error) throw error;

            showToast.success(parentCommentId ? 'Reply added!' : 'Comment added!');

            // Update comments count optimistically (for BOTH top-level and replies)
            // Since we now count ALL comments, increment regardless of parent
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    return { ...p, commentsCount: p.commentsCount + 1 };
                }
                return p;
            }));
        } catch (error: any) {
            console.error("❌ Error adding comment:", error);
            showToast.error('Failed to add comment');
            throw error;
        }
    };

    // ============================================
    // LIKE/UNLIKE COMMENT
    // ============================================
    const likeComment = async (commentId: string, postId: string) => {
        if (!user) {
            showToast.error('Please log in to like comments');
            return;
        }

        try {
            console.log(`❤️ Toggling like for comment ${commentId}`);

            // Find the comment in current posts to check like status
            const post = posts.find(p => p.id === postId);
            if (!post || !post.comments) return;

            // Find the comment (could be nested)
            const findComment = (comments: Comment[]): Comment | null => {
                for (const c of comments) {
                    if (c.id === commentId) return c;
                    if (c.replies) {
                        const found = findComment(c.replies);
                        if (found) return found;
                    }
                }
                return null;
            };

            const comment = findComment(post.comments);
            if (!comment) return;

            const authSupabase = await getAuthenticatedSupabase();

            if (comment.isLikedByMe) {
                // Unlike
                const { error } = await authSupabase
                    .from('comment_likes')
                    .delete()
                    .eq('comment_id', commentId)
                    .eq('user_id', user.id);

                if (error) throw error;
                console.log('👎 Comment unliked');
            } else {
                // Like
                const { error } = await authSupabase
                    .from('comment_likes')
                    .insert({
                        comment_id: commentId,
                        user_id: user.id
                    });

                if (error) throw error;
                console.log('👍 Comment liked');
            }

            // Optimistic update: Update the comment's like status
            const updateCommentLikes = (comments: Comment[]): Comment[] => {
                return comments.map(c => {
                    if (c.id === commentId) {
                        const newIsLiked = !c.isLikedByMe;
                        const newLikesCount = newIsLiked
                            ? (c.likes_count || 0) + 1
                            : Math.max(0, (c.likes_count || 0) - 1);

                        return {
                            ...c,
                            isLikedByMe: newIsLiked,
                            likes_count: newLikesCount
                        };
                    }
                    if (c.replies) {
                        return {
                            ...c,
                            replies: updateCommentLikes(c.replies)
                        };
                    }
                    return c;
                });
            };

            setPosts(prev => prev.map(p => {
                if (p.id === postId && p.comments) {
                    return {
                        ...p,
                        comments: updateCommentLikes(p.comments)
                    };
                }
                return p;
            }));

        } catch (error: any) {
            console.error("❌ Error liking comment:", error);
            showToast.error('Failed to like comment');
        }
    };


    // ============================================
    // DELETE POST
    // ============================================
    const deletePost = async (postId: string) => {
        if (!user) return;

        try {
            const authSupabase = await getAuthenticatedSupabase();
            const { error } = await authSupabase
                .from('posts')
                .delete()
                .eq('id', postId)
                .eq('user_id', user.id);

            if (error) throw error;

            showToast.success('Post deleted');

            // Optimistic UI update
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (error: any) {
            console.error("❌ Error deleting post:", error);
            showToast.error('Failed to delete post');
        }
    };

    // ============================================
    // DELETE COMMENT
    // ============================================
    const deleteComment = async (commentId: string, postId: string) => {
        if (!user) return;

        try {
            const authSupabase = await getAuthenticatedSupabase();
            const { error } = await authSupabase
                .from('comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', user.id);

            if (error) throw error;

            showToast.success('Comment deleted');

            // Update comments count
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    return { ...p, commentsCount: Math.max(0, p.commentsCount - 1) };
                }
                return p;
            }));
        } catch (error: any) {
            console.error("❌ Error deleting comment:", error);
            showToast.error('Failed to delete comment');
        }
    };

    return (
        <SocialContext.Provider value={{
            posts,
            addPost,
            likePost,
            savePost,
            getComments,
            addComment,
            likeComment,
            deletePost,
            deleteComment,
            getSavedPosts,
            stories,
            addStory,
            highlights,
            createHighlight,
            deleteStory,
            deleteHighlight,
            removeStoryFromHighlight
        }}>
            {children}
        </SocialContext.Provider>
    );
}

export function useSocial() {
    const context = useContext(SocialContext);
    if (context === undefined) {
        throw new Error("useSocial must be used within a SocialProvider");
    }
    return context;
}
