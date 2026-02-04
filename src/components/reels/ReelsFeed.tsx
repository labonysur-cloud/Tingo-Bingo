"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Bookmark, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReelComments from './ReelComments';
import toast from 'react-hot-toast';

interface Reel {
    id: string;
    video_url: string;
    thumbnail_url?: string;
    caption: string;
    created_at: string;
    user_id: string;
    likes_count: number;
    comments_count: number;
    saves_count: number;
    views_count: number;
    user: {
        username: string;
        avatar_url: string;
    };
    // Client-side/Optimistic state
    has_liked?: boolean;
    has_saved?: boolean;
}

import ShareModal from "../ui/ShareModal";

export default function ReelsFeed() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [reels, setReels] = useState<Reel[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCommentReelId, setActiveCommentReelId] = useState<string | null>(null);
    const [activeShareReel, setActiveShareReel] = useState<Reel | null>(null);

    const fetchReels = async () => {
        try {
            const initialId = searchParams.get('id');
            let initialReel: any = null;

            // 1a. Fetch Deep Linked Reel
            if (initialId) {
                const { data: specific } = await supabase
                    .from('reels')
                    .select(`*, user:users(username, avatar)`)
                    .eq('id', initialId)
                    .single();
                if (specific) initialReel = specific;
            }

            // 1b. Fetch Feed (excluding initial if present)
            let query = supabase
                .from('reels')
                .select(`*, user:users(username, avatar)`)
                .order('created_at', { ascending: false })
                .limit(20);

            if (initialId) {
                query = query.neq('id', initialId);
            }

            const { data: feedReels, error } = await query;
            if (error) throw error;

            // Combine
            const rawReels = initialReel ? [initialReel, ...(feedReels || [])] : (feedReels || []);

            let formattedReels: Reel[] = rawReels.map((r: any) => ({
                ...r,
                user: {
                    username: r.user?.username || r.user?.name || "Unknown",
                    avatar_url: r.user?.avatar || "/default-avatar.png"
                },
                has_liked: false,
                has_saved: false,
                views_count: r.views_count || 0
            }));

            // 2. If logged in, fetch user interactions (likes/saves) to set initial state
            if (user && formattedReels.length > 0) {
                const reelIds = formattedReels.map(r => r.id);

                // Fetch Likes
                const { data: likes } = await supabase
                    .from('reel_likes')
                    .select('reel_id')
                    .eq('user_id', user.id)
                    .in('reel_id', reelIds);

                // Fetch Saves
                const { data: saves } = await supabase
                    .from('reel_saves')
                    .select('reel_id')
                    .eq('user_id', user.id)
                    .in('reel_id', reelIds);

                const likedIds = new Set(likes?.map(l => l.reel_id));
                const savedIds = new Set(saves?.map(s => s.reel_id));

                formattedReels = formattedReels.map(r => ({
                    ...r,
                    has_liked: likedIds.has(r.id),
                    has_saved: savedIds.has(r.id)
                }));
            }

            setReels(formattedReels);
        } catch (error) {
            console.error("Error fetching reels:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReels();

        // 3. Realtime Subscription
        const channel = supabase
            .channel('public:reels')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'reels'
            }, (payload) => {
                // Update local state when a reel changes (likes, comments, views)
                setReels(prev => prev.map(r => {
                    if (r.id === payload.new.id) {
                        return {
                            ...r,
                            likes_count: payload.new.likes_count,
                            comments_count: payload.new.comments_count,
                            saves_count: payload.new.saves_count,
                            views_count: payload.new.views_count
                        };
                    }
                    return r;
                }));
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-black">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-64px)] w-full overflow-y-scroll snap-y snap-mandatory bg-black scrollbar-hide">
            {reels.map((reel) => (
                <ReelItem
                    key={reel.id}
                    reel={reel}
                    onOpenComments={() => setActiveCommentReelId(reel.id)}
                    onUpdate={(updated) => setReels(prev => prev.map(r => r.id === updated.id ? updated : r))}
                    onDelete={(id) => setReels(prev => prev.filter(r => r.id !== id))}
                    setActiveShareReel={setActiveShareReel}
                />
            ))}
            {reels.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-white/50 space-y-4">
                    <p>No Tangii yet.</p>
                    <p className="text-sm">Be the first to share one!</p>
                </div>
            )}

            {activeCommentReelId && (
                <ReelComments
                    reelId={activeCommentReelId}
                    reelOwnerId={reels.find(r => r.id === activeCommentReelId)?.user_id || ""}
                    onClose={() => setActiveCommentReelId(null)}
                />
            )}

            {activeShareReel && (
                <ShareModal
                    isOpen={!!activeShareReel}
                    onClose={() => setActiveShareReel(null)}
                    url={`${typeof window !== 'undefined' ? window.location.origin : ''}/reels?id=${activeShareReel.id}`}
                    title={activeShareReel.caption}
                />
            )}
        </div>
    );
}

function ReelItem({ reel, onUpdate, onDelete, onOpenComments, setActiveShareReel }: {
    reel: Reel;
    onUpdate: (updated: Reel) => void;
    onDelete: (id: string) => void;
    onOpenComments: () => void;
    setActiveShareReel: (reel: Reel) => void;
}) {
    const { user } = useAuth();
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [viewRecorded, setViewRecorded] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    // Like Handler
    const handleLike = async () => {
        if (!user) { toast.error("Login to like!"); return; }

        // Optimistic Update
        const newlyLiked = !reel.has_liked;
        onUpdate({
            ...reel,
            has_liked: newlyLiked,
            likes_count: (reel.likes_count || 0) + (newlyLiked ? 1 : -1)
        });

        try {
            if (newlyLiked) {
                await supabase.from('reel_likes').insert({ reel_id: reel.id, user_id: user.id });
                // Optional: Trigger nice animation here
            } else {
                await supabase.from('reel_likes').delete().eq('reel_id', reel.id).eq('user_id', user.id);
            }
        } catch (e) {
            // Revert on error
            onUpdate(reel);
            toast.error("Failed to like");
        }
    };

    // Save Handler
    const handleSave = async () => {
        if (!user) { toast.error("Login to save!"); return; }

        const newlySaved = !reel.has_saved;
        onUpdate({
            ...reel,
            has_saved: newlySaved,
            saves_count: (reel.saves_count || 0) + (newlySaved ? 1 : -1)
        });

        try {
            if (newlySaved) {
                await supabase.from('reel_saves').insert({ reel_id: reel.id, user_id: user.id });
                toast.success("Saved to Moodboard!");
            } else {
                await supabase.from('reel_saves').delete().eq('reel_id', reel.id).eq('user_id', user.id);
            }
        } catch (e) {
            onUpdate(reel);
        }
    };

    // Delete Handler
    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this reel?")) return;
        try {
            const { error } = await supabase.from('reels').delete().eq('id', reel.id);
            if (error) throw error;
            onDelete(reel.id);
            toast.success("Reel deleted");
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    // Check Follow Status
    useEffect(() => {
        const checkFollowStatus = async () => {
            if (!user || user.id === reel.user_id) return;

            const { data } = await supabase
                .from('follows')
                .select('*')
                .eq('follower_id', user.id)
                .eq('following_id', reel.user_id)
                .maybeSingle();

            setIsFollowing(!!data);
        };

        checkFollowStatus();
    }, [user, reel.user_id]);

    // Follow/Unfollow Handler
    const handleFollow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user || followLoading) return;

        setFollowLoading(true);
        try {
            if (isFollowing) {
                await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', reel.user_id);
                setIsFollowing(false);
                toast.success('Unfollowed');
            } else {
                await supabase
                    .from('follows')
                    .insert({ follower_id: user.id, following_id: reel.user_id });
                setIsFollowing(true);
                toast.success('Following!');
            }
        } catch (error) {
            console.error('Follow error:', error);
            toast.error('Failed to update follow status');
        } finally {
            setFollowLoading(false);
        }
    };

    // Increment View Handler
    const incrementView = async () => {
        if (viewRecorded) return;
        setViewRecorded(true);

        try {
            await supabase.rpc('increment_view_count', { row_id: reel.id });
        } catch (err) {
            console.log("View count increment failed (RPC likely missing)");
        }
    };

    // Make sure we have the RPC for views
    // We'll create it in the SQL file shortly.

    // Intersection Observer to auto-play when in view
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    videoRef.current?.play().then(() => {
                        incrementView();
                        setIsPlaying(true);
                    }).catch(() => { });
                } else {
                    videoRef.current?.pause();
                    setIsPlaying(false);
                }
            },
            { threshold: 0.6 } // Play when 60% visible
        );

        if (videoRef.current) observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, []);

    const togglePlay = () => {
        if (videoRef.current) {
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
                            setIsPlaying(false);
                        });
                }
            }
        }
    };

    return (
        <div className="relative w-full h-full snap-start bg-black flex items-center justify-center overflow-hidden">
            {/* Video Player */}
            <div className="relative w-full h-full cursor-pointer " onClick={togglePlay}>
                <video
                    ref={videoRef}
                    src={reel.video_url}
                    poster={reel.thumbnail_url}
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                />

                {/* Center Play Indicator */}
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <div className="bg-black/40 p-5 rounded-full backdrop-blur-md border border-white/20 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        </div>
                    </div>
                )}

                {/* Gradient Overlays for Readability */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
            </div>

            {/* Right Sidebar Actions */}
            <div className="absolute bottom-24 right-4 z-20 flex flex-col items-center gap-6">
                <ActionButton
                    icon={Heart}
                    count={reel.likes_count}
                    isActive={reel.has_liked}
                    activeColor="text-red-500 fill-red-500"
                    onClick={handleLike}
                />
                <ActionButton
                    icon={MessageCircle}
                    count={reel.comments_count}
                    activeColor="text-white fill-white"
                    onClick={onOpenComments}
                />
                <ActionButton
                    icon={Eye}
                    count={reel.views_count || 0}
                    activeColor="text-white fill-white"
                    onClick={() => { }}
                />
                <ActionButton
                    icon={Bookmark}
                    count={reel.saves_count}
                    isActive={reel.has_saved}
                    activeColor="text-yellow-400 fill-yellow-400"
                    onClick={handleSave}
                />
                <ActionButton
                    icon={Share2}
                    count={0}
                    activeColor="text-white"
                    onClick={() => setActiveShareReel(reel)}
                />
                {user?.id === reel.user_id && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                        className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:bg-red-500 hover:text-white transition-all duration-300"
                    >
                        <Trash2 className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Bottom Left Info */}
            <div className="absolute bottom-6 left-4 right-20 z-20 pointer-events-auto">
                <div className="flex items-center gap-3 mb-3">
                    <Link
                        href={`/user/${reel.user_id}`}
                        className="w-10 h-10 rounded-full border-2 border-orange-500 p-0.5 overflow-hidden hover:border-orange-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={reel.user?.avatar_url || "/default-avatar.png"}
                            alt={reel.user?.username}
                            className="w-full h-full rounded-full object-cover"
                        />
                    </Link>
                    <div className="flex flex-col">
                        <Link
                            href={`/user/${reel.user_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-white text-base shadow-sm drop-shadow-md hover:underline cursor-pointer"
                        >
                            @{reel.user?.username || "Unknown"}
                        </Link>
                        {/* Follow Button */}
                        <div className="text-xs text-white/70 flex items-center gap-1">
                            Original Audio •
                            {user && user.id !== reel.user_id && (
                                <button
                                    onClick={handleFollow}
                                    disabled={followLoading}
                                    className={`font-bold transition-colors ${isFollowing
                                            ? 'text-gray-300 hover:text-white'
                                            : 'text-orange-400 hover:text-orange-300'
                                        } disabled:opacity-50`}
                                >
                                    {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <p className="text-white/90 text-sm leading-relaxed font-light line-clamp-2 max-w-[90%] drop-shadow-md">
                    {reel.caption}
                </p>
            </div>
        </div>
    );
}

// Helper for Sidebar Buttons
function ActionButton({ icon: Icon, count, isActive, activeColor, onClick }: any) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex flex-col items-center gap-1 group"
        >
            <div className={`p-0 rounded-full transition-all duration-200 transform group-active:scale-90 ${isActive ? '' : ''}`}>
                <Icon
                    className={`w-8 h-8 drop-shadow-lg filter shadow-black ${isActive ? activeColor : 'text-white stroke-[2px]'}`}
                    fill={isActive ? "currentColor" : "rgba(0,0,0,0.3)"} // Fill transparent black for better contrast
                />
            </div>
            {count !== undefined && count > 0 && (
                <span className="text-xs font-semibold text-white drop-shadow-md">
                    {count}
                </span>
            )}
        </button>
    )
}

