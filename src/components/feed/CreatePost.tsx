"use client";

import { useAuth } from "@/context/AuthContext";
import { useSocial } from "@/context/SocialContext";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Image as ImageIcon, Send, X } from "lucide-react";
import { useRef, useState } from "react";

interface CreatePostProps {
    petId?: string;
}

export default function CreatePost({ petId }: CreatePostProps) {
    const { user } = useAuth();
    const { addPost } = useSocial();

    const [newPostText, setNewPostText] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newPostText.trim() && !selectedFile) || isPosting) return;

        setIsPosting(true);
        try {
            let imageUrl = undefined;

            // 1. Upload Image if selected
            if (selectedFile && user) {
                try {
                    imageUrl = await uploadToCloudinary(selectedFile);
                } catch (err: any) {
                    console.error("Image upload failed:", err);
                    alert(`Image upload failed: ${err.message || "Unknown error"}. Check your network tab for details.`);
                }
            }

            // 2. Create Post
            await addPost(newPostText, imageUrl, petId);

            // 3. Reset Form
            setNewPostText("");
            removeFile();
        } catch (error) {
            console.error("Error creating post:", error);
            alert("Failed to post. Please try again.");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100">
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"} alt="Me" className="w-full h-full object-cover" />
                </div>
                <form onSubmit={handlePost} className="flex-1">
                    <input
                        type="text"
                        placeholder="What's your pet up to?"
                        className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400 mt-2"
                        value={newPostText}
                        onChange={(e) => setNewPostText(e.target.value)}
                    />

                    {/* Image Preview */}
                    {previewUrl && (
                        <div className="relative mt-3 w-fit">
                            <img src={previewUrl} alt="Preview" className="h-32 rounded-lg border border-gray-200 object-cover" />
                            <button
                                type="button"
                                onClick={removeFile}
                                className="absolute -top-2 -right-2 bg-black text-white p-1 rounded-full shadow-lg hover:bg-gray-800"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-4 border-t border-gray-50 pt-3">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-gray-400 hover:text-green-500 transition-colors p-2 hover:bg-green-50 rounded-full"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            className="hidden"
                        />

                        <button
                            type="submit"
                            disabled={(!newPostText.trim() && !selectedFile) || isPosting}
                            className="bg-black text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-gray-800 transition-colors"
                        >
                            {isPosting ? "Posting..." : <>Post <Send className="w-3 h-3" /></>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
