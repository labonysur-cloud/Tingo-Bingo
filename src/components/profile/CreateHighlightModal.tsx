"use client";

import { useState, useEffect } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { useSocial, Story } from "@/context/SocialContext";
import { getAuthenticatedSupabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "../ui/Toaster";

interface CreateHighlightModalProps {
    onClose: () => void;
    initialStoryId?: string;
}

export default function CreateHighlightModal({ onClose, initialStoryId }: CreateHighlightModalProps) {
    const { user } = useAuth();
    const { createHighlight } = useSocial();
    const [title, setTitle] = useState("");
    const [myStories, setMyStories] = useState<Story[]>([]);
    const [selectedStories, setSelectedStories] = useState<string[]>(initialStoryId ? [initialStoryId] : []);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchAllMyStories = async () => {
            if (!user) return;
            const authSupabase = await getAuthenticatedSupabase();
            const { data } = await authSupabase
                .from('stories')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                // Map to Story interface
                const mapped: Story[] = data.map((d: any) => ({
                    id: d.id,
                    userId: d.user_id,
                    userName: user.name,
                    userAvatar: user.avatar,
                    mediaUrl: d.media_url,
                    type: d.type || 'image',
                    caption: d.caption,
                    createdAt: d.created_at,
                    expiresAt: d.expires_at // Not strict
                }));
                setMyStories(mapped);
            }
            setLoading(false);
        };

        fetchAllMyStories();
    }, [user]);

    const toggleSelection = (storyId: string) => {
        if (selectedStories.includes(storyId)) {
            setSelectedStories(prev => prev.filter(id => id !== storyId));
        } else {
            setSelectedStories(prev => [...prev, storyId]);
        }
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            showToast.error("Please enter a title");
            return;
        }
        if (selectedStories.length === 0) {
            showToast.error("Please select at least one story");
            return;
        }

        setIsCreating(true);
        // Use first selected story image as cover by default
        const firstStory = myStories.find(s => s.id === selectedStories[0]);
        const coverImage = firstStory?.mediaUrl;

        await createHighlight(title, selectedStories, coverImage);
        setIsCreating(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
            <div className="bg-white text-black w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold">New Highlight</h2>
                    <button onClick={onClose}><X className="w-6 h-6" /></button>
                </div>

                <div className="p-4 border-b">
                    <input
                        type="text"
                        placeholder="Highlight Name"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full text-center text-xl font-semibold outline-none py-2 border-b-2 border-transparent focus:border-primary transition-colors"
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <p className="text-sm text-gray-500 mb-2">Select Stories</p>
                    {loading ? (
                        <div className="text-center py-8">Loading stories...</div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {myStories.map(story => (
                                <div
                                    key={story.id}
                                    className={`aspect-[9/16] relative cursor-pointer rounded-lg overflow-hidden border-2 ${selectedStories.includes(story.id) ? 'border-primary' : 'border-transparent'}`}
                                    onClick={() => toggleSelection(story.id)}
                                >
                                    <img src={story.mediaUrl} className="w-full h-full object-cover" alt="" />
                                    {selectedStories.includes(story.id) && (
                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                            <div className="bg-primary text-white p-1 rounded-full">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t">
                    <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="w-full bg-primary text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Highlight"}
                    </button>
                </div>
            </div>
        </div>
    );
}
