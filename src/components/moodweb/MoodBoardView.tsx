"use client";

import { useEffect, useState } from "react";
import { Plus, LayoutGrid, Play } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

type SavedItem = {
    id: string; // The ID of the original post/reel
    type: 'post' | 'reel';
    image_url: string;
    caption?: string;
    created_at: string;
    user?: {
        username: string;
        avatar: string;
    }
};

export default function MoodBoardView() {
    const { user } = useAuth();
    const [items, setItems] = useState<SavedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchSavedItems = async () => {
            setLoading(true);
            try {
                // 1. Fetch Saved Post IDs
                // Assuming a table 'saved_posts' exists linking users to posts like 'reel_saves'
                // If not, we might need to rely on the 'post_saves' logic from SocialContext if stored differently
                // For now, I'll assume a standard many-to-many or investigate if I should use SocialContext
                // But typically direct SQL is clearer for mixed feeds.

                // Let's try sticking to 'reel_saves' first as specifically requested.
                // The user asked for "saved tangii".

                const { data: savedReels, error: reelError } = await supabase
                    .from('reel_saves')
                    .select(`
                        created_at,
                        reel:reels (
                            id,
                            video_url,
                            thumbnail_url,
                            caption,
                            user:users (username, avatar)
                        )
                    `)
                    .eq('user_id', user.id);

                if (reelError) throw reelError;

                const formattedReels = (savedReels || []).map((item: any) => ({
                    id: item.reel.id,
                    type: 'reel' as const,
                    image_url: item.reel.thumbnail_url || item.reel.video_url, // Fallback for video if no thumb
                    caption: item.reel.caption,
                    created_at: item.created_at,
                    user: {
                        username: item.reel.user?.username || 'Unknown',
                        avatar: item.reel.user?.avatar
                    }
                }));

                // Merging with posts? The request specifically said "saved tangii is not visible".
                // I will prioritize showing Tangii. If posts logic is needed, I can add it, but let's ensure Tangii works first.

                setItems(formattedReels);

            } catch (error) {
                console.error("Error fetching moodboard:", error);
                toast.error("Could not load Mood Board");
            } finally {
                setLoading(false);
            }
        };

        fetchSavedItems();
    }, [user]);

    if (!user) return <div className="p-10 text-center">Please log in to view your Mood Board.</div>;

    return (
        <div className="pb-24 min-h-screen bg-gray-50 p-4">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mood Board</h1>
                    <p className="text-sm font-medium text-gray-400">Your saved collection</p>
                </div>
                <button className="bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors">
                    <Plus className="w-6 h-6" />
                </button>
            </header>

            {loading ? (
                <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                    <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 transform rotate-12">
                        <LayoutGrid className="w-10 h-10 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Start Collecting</h3>
                    <p className="text-gray-500 max-w-xs mb-8">Save Tangii videos to build your mood board.</p>
                </div>
            ) : (
                <div className="columns-2 md:columns-3 gap-4 space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-black mb-4">
                            {item.type === 'reel' ? (
                                <div className="relative">
                                    <video
                                        src={item.image_url}
                                        className="w-full h-auto object-cover"
                                        poster={item.image_url} // If it's a thumbnail URL it works, if video URL it might try to load first frame
                                        muted
                                        loop
                                        onMouseOver={e => e.currentTarget.play()}
                                        onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                    />
                                    <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                                        <Play className="w-3 h-3 text-white fill-white" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                        <p className="text-white text-xs line-clamp-2">{item.caption}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <img src={item.user?.avatar || '/default-avatar.png'} className="w-5 h-5 rounded-full border border-white/50" />
                                            <span className="text-white/80 text-[10px]">{item.user?.username}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Placeholder for posts if we add them later
                                <img src={item.image_url} className="w-full h-auto" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
