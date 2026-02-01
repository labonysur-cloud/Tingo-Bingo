"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { updateProfile } from "firebase/auth";
import { ArrowLeft, Camera, Loader2, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EditProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Form State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const petFileInputRef = useRef<HTMLInputElement>(null);

    // Form State - Owner
    const [name, setName] = useState(user?.name || "");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");
    const [avatar, setAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);

    // Form State - Pets (Multi-Pet System)
    const [myPets, setMyPets] = useState<any[]>([]);
    const [activePetId, setActivePetId] = useState<string | 'new'>('new'); // 'new' or UUID

    // Current Pet Form State
    const [petName, setPetName] = useState("");
    const [petSpecies, setPetSpecies] = useState("cat");
    const [petBreed, setPetBreed] = useState("");
    const [petAge, setPetAge] = useState("");
    const [petGender, setPetGender] = useState("unknown");
    const [petBio, setPetBio] = useState("");
    const [petAvatar, setPetAvatar] = useState<File | null>(null);
    const [petAvatarPreview, setPetAvatarPreview] = useState<string | null>(null);

    // Load initial data
    useEffect(() => {
        const loadUserData = async () => {
            if (!user) return;
            try {
                // 1. Get User Data
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (userError) throw userError;

                if (userData) {
                    setName(prev => userData.name || prev);
                    setUsername(userData.username || "");
                    setBio(userData.bio || "");
                    setLocation(userData.location || "");
                    setAvatarPreview(prev => userData.avatar || prev);
                }

                // 2. Get All Pets
                const { data: pets } = await supabase
                    .from('pets')
                    .select('*')
                    .eq('owner_id', user.id)
                    .order('created_at', { ascending: true }); // Oldest first (usually primary)

                if (pets && pets.length > 0) {
                    setMyPets(pets);
                    // Select the first pet by default
                    selectPet(pets[0]);
                } else {
                    setMyPets([]);
                    resetPetForm(); // Ready to add first pet
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

    const selectPet = (pet: any) => {
        setActivePetId(pet.id);
        setPetName(pet.name || "");
        setPetSpecies(pet.species || "cat");
        setPetBreed(pet.breed || "");
        setPetAge(pet.age || "");
        setPetGender(pet.gender || "unknown");
        setPetBio(pet.bio || "");
        setPetAvatarPreview(pet.avatar || null);
        setPetAvatar(null); // Reset file input
    };

    const resetPetForm = () => {
        setActivePetId('new');
        setPetName("");
        setPetSpecies("cat");
        setPetBreed("");
        setPetAge("");
        setPetGender("unknown");
        setPetBio("");
        setPetAvatarPreview(null);
        setPetAvatar(null);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isPet: boolean = false) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (isPet) {
                setPetAvatar(file);
                setPetAvatarPreview(URL.createObjectURL(file));
            } else {
                setAvatar(file);
                setAvatarPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleDeletePet = async () => {
        if (activePetId === 'new' || !confirm("Are you sure you want to delete this pet? This cannot be undone.")) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('pets')
                .delete()
                .eq('id', activePetId);

            if (error) throw error;

            // Remove from list
            const updatedPets = myPets.filter(p => p.id !== activePetId);
            setMyPets(updatedPets);

            if (updatedPets.length > 0) {
                selectPet(updatedPets[0]);
            } else {
                resetPetForm();
            }
            alert("Pet deleted.");
        } catch (error) {
            console.error("Error deleting pet:", error);
            alert("Failed to delete pet.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            let photoURL = avatarPreview;

            // 1. Upload Owner Avatar
            if (avatar) {
                try {
                    photoURL = await uploadToCloudinary(avatar);
                    if (auth.currentUser) {
                        await updateProfile(auth.currentUser, { photoURL });
                    }
                } catch (uploadError) {
                    console.error("Avatar upload failed:", uploadError);
                }
            }

            // 2. Update Owner Profile
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
                }, { onConflict: 'id' });

            if (upsertError) throw upsertError;

            // 3. Save Pet Data (Only if name is provided)
            if (petName.trim()) {
                console.log("Saving Pet Data...");
                let petPhotoURL = petAvatarPreview;

                if (petAvatar) {
                    petPhotoURL = await uploadToCloudinary(petAvatar);
                }

                const petDataToSave = {
                    owner_id: user.id,
                    name: petName,
                    species: petSpecies,
                    breed: petBreed,
                    age: petAge,
                    gender: petGender,
                    bio: petBio,
                    avatar: petPhotoURL,
                    updated_at: new Date().toISOString()
                };

                if (activePetId && activePetId !== 'new') {
                    // Update Existing
                    const { error: petUpdateError } = await supabase
                        .from('pets')
                        .update(petDataToSave)
                        .eq('id', activePetId);
                    if (petUpdateError) throw petUpdateError;
                } else {
                    // Insert New
                    const { data: newPet, error: petInsertError } = await supabase
                        .from('pets')
                        .insert([{
                            ...petDataToSave,
                            is_primary: myPets.length === 0 // Make primary if it's the first one
                        }])
                        .select()
                        .single();

                    if (petInsertError) throw petInsertError;

                    // Add to local list immediately
                    setMyPets(prev => [...prev, newPet]);
                    setActivePetId(newPet.id);

                    // If it's the first pet, set as primary details in user
                    if (myPets.length === 0) {
                        await supabase.from('users').update({ primary_pet_id: newPet.id }).eq('id', user.id);
                    }
                }
            }

            alert("Saved successfully!");
            router.push("/profile");

        } catch (error: any) {
            console.error("Error updating profile:", error);
            alert(`Failed to update profile: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

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
                    {/* Owner Avatar Upload */}
                    <div className="flex flex-col items-center">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Owner Photo</h2>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-32 h-32 rounded-full cursor-pointer group"
                        >
                            <img
                                src={avatarPreview || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"}
                                alt="Avatar"
                                className="w-full h-full rounded-full object-cover border-4 border-white shadow-md bg-gray-100"
                            />
                            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => handleFileSelect(e, false)}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* PET PROFILE SECTION */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 ring-4 ring-orange-50/50">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
                                <h2 className="font-bold text-xl text-gray-900">Pet Profiles</h2>
                            </div>
                            {/* Delete Button (if editing existing pet) */}
                            {activePetId !== 'new' && (
                                <button type="button" onClick={handleDeletePet} className="text-red-400 hover:text-red-500">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Pet Selection List */}
                        <div className="flex gap-4 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                            {/* "Add New" Button */}
                            <button
                                type="button"
                                onClick={resetPetForm}
                                className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center transition-all ${activePetId === 'new'
                                    ? 'bg-orange-500 text-white ring-2 ring-offset-2 ring-orange-500 shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    }`}
                            >
                                <Plus className="w-8 h-8" />
                            </button>

                            {/* Existing Pets */}
                            {myPets.map((pet) => (
                                <div
                                    key={pet.id}
                                    onClick={() => selectPet(pet)}
                                    className={`flex-shrink-0 relative cursor-pointer transition-all ${activePetId === pet.id
                                        ? 'scale-105'
                                        : 'opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${activePetId === pet.id ? 'border-orange-500 ring-2 ring-offset-2 ring-orange-500' : 'border-gray-200'}`}>
                                        <img src={pet.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${pet.name}`} className="w-full h-full object-cover" alt={pet.name} />
                                    </div>
                                    <p className="text-[10px] text-center mt-1 font-bold text-gray-600 truncate max-w-[64px]">{pet.name}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                                {activePetId === 'new' ? 'Add New Pet' : `Editing ${petName}`}
                            </h3>

                            {/* Pet Avatar */}
                            <div className="flex flex-col items-center mb-6">
                                <div
                                    onClick={() => petFileInputRef.current?.click()}
                                    className="relative w-28 h-28 rounded-full cursor-pointer group"
                                >
                                    <img
                                        src={petAvatarPreview || `https://api.dicebear.com/7.x/notionists/svg?seed=${petName || 'pet'}`}
                                        alt="Pet Avatar"
                                        className="w-full h-full rounded-full object-cover border-4 border-orange-100 shadow-md bg-orange-50"
                                    />
                                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                    <input
                                        type="file"
                                        ref={petFileInputRef}
                                        onChange={(e) => handleFileSelect(e, true)}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                                <p className="text-xs text-orange-600 mt-2 font-medium">Tap to change photo</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Pet Name</label>
                                <input
                                    type="text"
                                    value={petName}
                                    onChange={(e) => setPetName(e.target.value)}
                                    className="modern-input border-orange-200 focus:border-orange-500 focus:ring-orange-200"
                                    placeholder="e.g. Fluffy"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Species</label>
                                    <select
                                        value={petSpecies}
                                        onChange={(e) => setPetSpecies(e.target.value)}
                                        className="modern-input"
                                    >
                                        <option value="cat">Cat</option>
                                        <option value="dog">Dog</option>
                                        <option value="bird">Bird</option>
                                        <option value="rabbit">Rabbit</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Gender</label>
                                    <select
                                        value={petGender}
                                        onChange={(e) => setPetGender(e.target.value)}
                                        className="modern-input"
                                    >
                                        <option value="unknown">Not Specified</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Breed</label>
                                    <input
                                        type="text"
                                        value={petBreed}
                                        onChange={(e) => setPetBreed(e.target.value)}
                                        className="modern-input"
                                        placeholder="e.g. Persian"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Age</label>
                                    <input
                                        type="text"
                                        value={petAge}
                                        onChange={(e) => setPetAge(e.target.value)}
                                        className="modern-input"
                                        placeholder="e.g. 2 years"
                                    />
                                </div>
                            </div>

                        </div>
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
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Owner Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="modern-input min-h-[100px]"
                                placeholder="Tell us about yourself..."
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
        </div >
    );
}
