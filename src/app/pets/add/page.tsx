"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getAuthenticatedSupabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ArrowLeft, Camera, Loader2, Save } from "lucide-react";
import Link from "next/link";

const SPECIES = ["Dog", "Cat", "Bird", "Rabbit", "Hamster", "Fish", "Other"];

export default function AddPetPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [species, setSpecies] = useState("Dog");
    const [breed, setBreed] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("Male");
    const [bio, setBio] = useState("");
    const [avatar, setAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) {
            alert("Pet name is required!");
            return;
        }

        setLoading(true);

        try {
            let photoURL = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;

            // 1. Upload pet photo if selected (Cloudinary auto-optimizes)
            if (avatar) {
                try {
                    console.log("Uploading pet photo to Cloudinary...");
                    photoURL = await uploadToCloudinary(avatar);
                    console.log("Photo uploaded successfully:", photoURL);
                } catch (uploadError) {
                    console.error("Photo upload failed:", uploadError);
                    alert("Photo upload failed. Using default avatar.");
                }
            }

            // 2. Insert pet into Supabase with authentication
            const supabase = await getAuthenticatedSupabase();
            const { data, error } = await supabase
                .from('pets')
                .insert({
                    owner_id: user.id,
                    name,
                    species,
                    breed,
                    age,
                    gender,
                    avatar: photoURL,
                    bio
                })
                .select()
                .single();

            if (error) throw error;

            console.log("Pet added:", data);
            alert(`${name} added successfully! 🎉`);
            router.push("/profile");

        } catch (error: any) {
            console.error("Error adding pet:", error);
            alert(`Failed to add pet: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <header className="bg-white sticky top-0 z-10 px-4 py-3 shadow-sm flex items-center gap-3">
                <Link href="/profile" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Add New Pet</h1>
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
                                src={avatarPreview || "https://api.dicebear.com/7.x/avataaars/svg?seed=pet"}
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
                        <p className="text-sm text-gray-500 mt-3 font-medium">Tap to add your pet's photo</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    {/* Pet Details */}
                    <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Pet Details</h2>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Pet's Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="modern-input"
                                placeholder="e.g. Max, Luna, Buddy"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Species</label>
                                <select
                                    value={species}
                                    onChange={(e) => setSpecies(e.target.value)}
                                    className="modern-input"
                                >
                                    {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Gender</label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="modern-input"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Unknown">Unknown</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Breed</label>
                                <input
                                    type="text"
                                    value={breed}
                                    onChange={(e) => setBreed(e.target.value)}
                                    className="modern-input"
                                    placeholder="e.g. Golden Retriever"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Age</label>
                                <input
                                    type="text"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="modern-input"
                                    placeholder="e.g. 2 years"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Bio / Personality</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="modern-input min-h-[100px]"
                                placeholder="Tell us about your pet's personality, favorite activities, quirks..."
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Add Pet</>}
                    </button>
                </form>
            </main>
        </div>
    );
}
