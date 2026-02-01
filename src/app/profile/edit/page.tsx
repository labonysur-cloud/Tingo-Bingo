"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { updateProfile } from "firebase/auth";
import { ArrowLeft, Camera, Loader2, Save } from "lucide-react";
import Link from "next/link";

export default function EditProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Form State
    // Form State - Owner/User data only (pets managed separately)
    const [name, setName] = useState(user?.name || "");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");
    const [avatar, setAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load initial data from Supabase
    useEffect(() => {
        const loadUserData = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    setName(prev => data.name || prev);
                    setUsername(data.username || "");
                    setBio(data.bio || "");
                    setLocation(data.location || "");
                    setAvatarPreview(prev => data.avatar || prev);
                }
            } catch (err) {
                console.error("Failed to load profile:", err);
            } finally {
                setFetching(false);
            }
        };

        if (user) {
            setName(prev => user.name || prev);
            setAvatarPreview(prev => user.avatar || prev);
            loadUserData();
        }
    }, [user]);

    // ... 

    // ... 

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            let photoURL = avatarPreview;

            // 1. Upload new avatar if selected (Cloudinary auto-optimizes)
            if (avatar) {
                try {
                    console.log("Starting image upload to Cloudinary...");
                    photoURL = await uploadToCloudinary(avatar);
                    console.log("Image uploaded successfully:", photoURL);

                    // Update Auth Profile
                    if (auth.currentUser) {
                        await updateProfile(auth.currentUser, { photoURL });
                    }
                } catch (uploadError) {
                    console.error("Avatar upload failed:", uploadError);
                    alert("Image upload failed. Saving other changes...");
                }
            }

            // 2. Update Supabase User Profile (Database)
            console.log("Saving to Supabase...");

            const { error: upsertError } = await supabase
                .from('users')
                .upsert({
                    id: user.id,
                    email: user.email,
                    name,
                    username: username || null,
                    bio,
                    location,
                    avatar: photoURL,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });

            if (upsertError) {
                throw upsertError;
            }

            console.log("Supabase save complete!");

            // 3. Update Auth Display Name
            if (name !== user.name && auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: name });
            }

            alert("Profile Updated Successfully!");
            router.push("/profile");

        } catch (error: any) {
            console.error("Error updating profile:", error);
            alert(`Failed to update profile: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // REMOVED BLOCKING LOADER
    // if (fetching) return <...Loader...>;

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <header className="bg-white sticky top-0 z-10 px-4 py-3 shadow-sm flex items-center gap-3">
                <Link href="/profile" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
            </header>

            <main className="max-w-lg mx-auto p-6">
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-32 h-32 rounded-full cursor-pointer group"
                        >
                            <img
                                src={avatarPreview || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"}
                                alt="Avatar"
                                className="w-full h-full rounded-full object-cover border-4 border-white shadow-md"
                            />
                            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                            <div className="absolute bottom-0 right-0 bg-primary p-2 rounded-full shadow-lg border-2 border-white">
                                <Camera className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3 font-medium">Tap to change photo</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Owner Profile</h2>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Your Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="modern-input"
                                placeholder="Your Name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Username (optional)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-gray-400 font-bold">@</span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                    className="modern-input pl-10"
                                    placeholder="yourname"
                                    disabled={!!user?.username}
                                />
                            </div>
                            {user?.username && (
                                <p className="text-xs text-gray-400 mt-1">Username cannot be changed once set</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Bio / Story</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="modern-input min-h-[100px]"
                                placeholder="Tell us about your pet's personality..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Location</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="modern-input"
                                placeholder="City, Country"
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
                    </button>
                </form>
            </main>
        </div>
    );
}
