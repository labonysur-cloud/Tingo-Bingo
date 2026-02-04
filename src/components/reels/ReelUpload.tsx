"use client";

import { useState, useRef } from 'react';
import { Upload, X, Film, Loader2 } from 'lucide-react';
import { uploadVideoSigned } from '@/lib/cloudinary';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function ReelUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
    const { user } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [caption, setCaption] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Size Check (100MB allowed now because direct upload is robust)
        if (file.size > 100 * 1024 * 1024) {
            toast.error("Video too large. Max 100MB.");
            return;
        }

        // 2. Client-side Duration Check (via Metadata)
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            if (video.duration > 180) { // Increased to 3 mins
                toast.error("Video must be 3 minutes or less.");
                return;
            }
            setPreviewUrl(URL.createObjectURL(file));
            setSelectedFile(file);
        };
        video.src = URL.createObjectURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile || !user) return;

        try {
            setIsUploading(true);
            const { url, thumbnail_url, duration } = await uploadVideoSigned(selectedFile);

            // Save to Supabase
            const { error } = await supabase.from('reels').insert({
                user_id: user.id, // Corrected from uid to id
                video_url: url,
                thumbnail_url: thumbnail_url,
                caption: caption,
                duration: duration
            });

            if (error) throw error;

            toast.success("Tangii shared successfully!");
            setPreviewUrl(null);
            setSelectedFile(null);
            setCaption('');
            if (onUploadComplete) onUploadComplete();

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to upload reel");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Film className="w-5 h-5 text-orange-500" />
                Share a Tangii
            </h3>

            {!previewUrl ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:bg-white/5 transition-colors"
                >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-400">Click to upload video (Max 2 mins)</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="video/*"
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden max-h-[400px]">
                        <video src={previewUrl} controls className="w-full h-full object-contain" />
                        <button
                            onClick={() => {
                                setPreviewUrl(null);
                                setSelectedFile(null);
                            }}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder="Add a caption..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 outline-none focus:border-orange-500 transition-colors"
                    />

                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            "Share Tangii"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
