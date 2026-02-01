"use client";

import { useSocial } from "@/context/SocialContext";
import { Plus } from "lucide-react";
import { useState } from "react";
import CreateHighlightModal from "./CreateHighlightModal";
import StoryViewer from "../stories/StoryViewer";

interface HighlightsBarProps {
    userId: string;
    isMe: boolean;
}

export default function HighlightsBar({ userId, isMe }: HighlightsBarProps) {
    const { highlights } = useSocial();
    const [isCreating, setIsCreating] = useState(false);
    const [viewingHighlight, setViewingHighlight] = useState<string | null>(null);

    // Filter highlights for this user
    const userHighlights = highlights.filter(h => h.userId === userId && h.stories.length > 0);

    const activeHighlight = viewingHighlight ? userHighlights.find(h => h.id === viewingHighlight) : null;

    if (!isMe && userHighlights.length === 0) return null;

    return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-4">
            {/* Create Button (Only for me) */}
            {isMe && (
                <div
                    className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                    onClick={() => setIsCreating(true)}
                >
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 group-hover:border-primary transition-colors">
                        <Plus className="w-6 h-6 text-gray-400 group-hover:text-primary" />
                    </div>
                    <span className="text-xs mt-1 font-medium text-gray-600 truncate max-w-[70px]">New</span>
                </div>
            )}

            {/* Highlights List */}
            {userHighlights.map(highlight => (
                <div
                    key={highlight.id}
                    className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                    onClick={() => setViewingHighlight(highlight.id)}
                >
                    <div className="w-16 h-16 rounded-full border-2 border-gray-200 p-0.5 overflow-hidden">
                        <img
                            src={highlight.coverImage || "https://placehold.co/100x100?text=Highlight"}
                            alt={highlight.title}
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                    <span className="text-xs mt-1 font-medium text-gray-900 truncate max-w-[70px]">{highlight.title}</span>
                </div>
            ))}

            {isCreating && (
                <CreateHighlightModal onClose={() => setIsCreating(false)} />
            )}

            {activeHighlight && (
                <StoryViewer
                    stories={activeHighlight.stories}
                    onClose={() => setViewingHighlight(null)}
                    highlightId={activeHighlight.id}
                />
            )}
        </div>
    );
}
