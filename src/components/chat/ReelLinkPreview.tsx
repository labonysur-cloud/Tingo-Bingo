"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Use client for read-only access
import { Play } from "lucide-react";
import Link from "next/link";

interface ReelPreviewProps {
    reelId: string;
}

export default function ReelLinkPreview({ reelId }: ReelPreviewProps) {
    const [reel, setReel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchReel = async () => {
            try {
                const { data, error } = await supabase
                    .from('reels')
                    .select('thumbnail_url, caption, user:users(name, avatar)')
                    .eq('id', reelId)
                    .single();

                if (error || !data) throw error;
                setReel(data);
            } catch (err) {
                console.error("Failed to load reel preview", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (reelId) fetchReel();
    }, [reelId]);

    if (loading) return <div className="w-48 h-24 bg-gray-100 rounded-xl animate-pulse mt-2" />;
    if (error || !reel) return null; // Fallback to just text if load fails

    return (
        <Link href={`/reels?id=${reelId}`} className="block mt-2 group">
            <div className="flex bg-gray-50 border border-gray-100 rounded-xl overflow-hidden max-w-[280px] transition-all hover:bg-gray-100">
                {/* Thumbnail */}
                <div className="relative w-20 h-28 flex-shrink-0 bg-black">
                    <img
                        src={reel.thumbnail_url}
                        alt="Reel"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                            <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        <img
                            src={reel.user?.avatar || "/default-avatar.png"}
                            alt={reel.user?.name}
                            className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-gray-700 truncate">{reel.user?.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                        {reel.caption || "Watch this Tangii!"}
                    </p>
                    <span className="text-[10px] text-blue-500 font-medium mt-1">Watch Tangii</span>
                </div>
            </div>
        </Link>
    );
}
