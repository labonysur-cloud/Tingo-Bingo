"use client";

import { useState, useEffect, useRef } from "react";
import { X, MoreVertical, Trash2, Heart, PlusCircle } from "lucide-react";
import { Story, useSocial } from "@/context/SocialContext";
import { useAuth } from "@/context/AuthContext";
import CreateHighlightModal from "../profile/CreateHighlightModal";
import Link from "next/link";

interface StoryViewerProps {
    stories: Story[];
    onClose: () => void;
    highlightId?: string; // Optional: If viewing from within a highlight
}

export default function StoryViewer({ stories, onClose, highlightId }: StoryViewerProps) {
    const { user } = useAuth();
    const { deleteStory, removeStoryFromHighlight, deleteHighlight } = useSocial();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isHighlightModalOpen, setIsHighlightModalOpen] = useState(false);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);

    const activeStory = stories[currentIndex];
    const DURATION = 5000; // 5 seconds per story

    useEffect(() => {
        // Reset progress on story change
        setProgress(0);

        // Start timer
        // Start timer
        const startTime = Date.now();

        progressInterval.current = setInterval(() => {
            if (isMenuOpen || isHighlightModalOpen) return; // Pause if menu/modal is open

            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / DURATION) * 100, 100);
            setProgress(newProgress);

            if (elapsed >= DURATION) {
                if (currentIndex < stories.length - 1) {
                    nextStory();
                } else {
                    onClose(); // End of stories
                }
            }
        }, 50);

        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, [currentIndex]);

    const nextStory = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const prevStory = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    if (!activeStory) return null;

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                {stories.map((story, idx) => (
                    <div key={story.id} className="h-1 flex-1 bg-gray-600 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-75 ease-linear"
                            style={{
                                width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%"
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="absolute inset-0 flex z-10">
                <div className="w-1/3 h-full" onClick={prevStory} />
                <div className="w-1/3 h-full" onClick={nextStory} /> {/* Middle tap advances too? Usually left 1/3 is back, right 2/3 is next */}
                <div className="w-1/3 h-full" onClick={nextStory} />
            </div>

            <button
                onClick={onClose}
                className="absolute top-6 right-4 text-white z-30 p-2 hover:bg-black/20 rounded-full"
            >
                <X className="w-6 h-6" />
            </button>

            {/* User Info - Clickable */}
            <div className="absolute top-8 left-4 z-30 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <Link href={`/profile/${activeStory.userId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img
                        src={activeStory.userAvatar}
                        alt={activeStory.userName}
                        className="w-10 h-10 rounded-full border-2 border-white"
                    />
                    <div className="flex flex-col">
                        <span className="text-white font-bold text-sm shadow-black drop-shadow-md leading-none">
                            {activeStory.userName}
                        </span>
                        <span className="text-gray-300 text-xs shadow-black drop-shadow-md mt-0.5">
                            {new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </Link>
            </div>

            {/* More Options (Only for me) */}
            {user?.id === activeStory.userId && (
                <div className="absolute top-6 right-16 z-30">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                        className="text-white p-2 hover:bg-black/20 rounded-full transition-colors"
                    >
                        <MoreVertical className="w-6 h-6" />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {!highlightId && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMenuOpen(false);
                                        setIsHighlightModalOpen(true);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 font-medium"
                                >
                                    <PlusCircle className="w-4 h-4" /> Add to Highlight
                                </button>
                            )}

                            {highlightId && (
                                <>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm("Remove this story from highlight?")) {
                                                await removeStoryFromHighlight(highlightId, activeStory.id);
                                                if (stories.length <= 1) onClose();
                                            }
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-orange-600 font-medium"
                                    >
                                        <Trash2 className="w-4 h-4" /> Remove from Highlight
                                    </button>

                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm("Delete this entire highlight collection?")) {
                                                await deleteHighlight(highlightId);
                                                onClose();
                                            }
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-red-600 font-medium border-t"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete Highlight
                                    </button>
                                </>
                            )}

                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm("Are you sure you want to delete this story?")) {
                                        await deleteStory(activeStory.id);
                                        onClose();
                                    }
                                    setIsMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-red-600 font-medium"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Story
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Highlight Modal Overlay */}
            {isHighlightModalOpen && (
                <div className="fixed inset-0 z-[60]" onClick={(e) => e.stopPropagation()}>
                    <CreateHighlightModal
                        onClose={() => setIsHighlightModalOpen(false)}
                        initialStoryId={activeStory.id}
                    />
                </div>
            )}

            {/* Media */}
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <img
                    src={activeStory.mediaUrl}
                    alt="Story"
                    className="max-w-full max-h-full object-contain"
                />
            </div>

            {/* Caption */}
            {activeStory.caption && (
                <div className="absolute bottom-10 left-0 w-full text-center p-4 z-20">
                    <p className="text-white text-lg font-medium shadow-black drop-shadow-lg bg-black/30 p-2 rounded-xl inline-block backdrop-blur-sm">
                        {activeStory.caption}
                    </p>
                </div>
            )}
        </div>
    );
}
