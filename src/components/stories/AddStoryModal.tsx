"use client";

import { useState, useRef } from "react";
import { X, Send, Image as ImageIcon, Sparkles } from "lucide-react";
import { useSocial } from "@/context/SocialContext";

interface AddStoryModalProps {
    onClose: () => void;
}

const FILTERS = [
    { name: "Normal", class: "" },
    { name: "Vintage", class: "sepia contrast-125 brightness-90" },
    { name: "B&W", class: "grayscale contrast-125" },
    { name: "Warm", class: "sepia-[.5] hue-rotate-15 contrast-110" },
    { name: "Cool", class: "hue-rotate-180 brightness-110 saturate-50" },
    { name: "Cyber", class: "contrast-125 saturate-200 hue-rotate-[20deg]" },
];

export default function AddStoryModal({ onClose }: AddStoryModalProps) {
    const { addStory } = useSocial();
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [caption, setCaption] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handlePost = async () => {
        if (!file) return;
        setIsUploading(true);
        try {
            await addStory(file, "image", caption); // TODO: pass filter if backend supports it
            onClose();
        } catch (error) {
            console.error("Failed to post story", error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center animate-in fade-in duration-200">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/40 hover:bg-black/60 z-10"
            >
                <X className="w-6 h-6" />
            </button>

            {!file ? (
                <div className="flex flex-col items-center gap-4 text-white">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                        <ImageIcon className="w-10 h-10" />
                    </div>
                    <p className="font-semibold">Select a photo</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </div>
            ) : (
                <div className="w-full h-full flex flex-col relative bg-black">
                    {/* Preview Area */}
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewUrl!}
                            alt="Preview"
                            className={`max-w-full max-h-full object-contain transition-all duration-300 ${selectedFilter}`}
                        />

                        {/* Caption Overlay Input */}
                        <div className="absolute overflow-hidden bottom-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent pt-12">
                            <input
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Add a caption..."
                                className="w-full bg-transparent text-white placeholder-gray-300 outline-none text-center font-medium shadow-black drop-shadow-md"
                            />
                        </div>
                    </div>

                    {/* Filter Selector */}
                    <div className="h-32 bg-black/90 p-4 border-t border-gray-800">
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                            {FILTERS.map((filter) => (
                                <button
                                    key={filter.name}
                                    onClick={() => setSelectedFilter(filter.class)}
                                    className={`flex flex-col items-center gap-2 min-w-[60px] ${selectedFilter === filter.class ? 'text-primary' : 'text-gray-400'}`}
                                >
                                    <div className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${selectedFilter === filter.class ? 'border-primary scale-110' : 'border-gray-600'}`}>
                                        <img
                                            src={previewUrl!}
                                            className={`w-full h-full object-cover ${filter.class}`}
                                            alt={filter.name}
                                        />
                                    </div>
                                    <span className="text-xs font-medium">{filter.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-4 flex justify-end bg-black">
                        <button
                            onClick={handlePost}
                            disabled={isUploading}
                            className="bg-primary text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {isUploading ? "Posting..." : <>Share Story <Send className="w-4 h-4" /></>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
