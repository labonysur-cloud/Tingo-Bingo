"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ArrowLeft, Loader2, Check, X, Camera, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function EmailSignupPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // User/Owner Info
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [location, setLocation] = useState("");
    const [bio, setBio] = useState("");

    // Pet Info
    const [petName, setPetName] = useState("");
    const [petSpecies, setPetSpecies] = useState("");
    const [petBreed, setPetBreed] = useState("");
    const [petAge, setPetAge] = useState("");
    const [petGender, setPetGender] = useState("");
    const [petBio, setPetBio] = useState("");
    const [petPhoto, setPetPhoto] = useState<File | null>(null);
    const [petPhotoPreview, setPetPhotoPreview] = useState<string | null>(null);

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Username availability check (debounced)
    const checkUsername = async (value: string) => {
        if (value.length < 3) {
            setUsernameAvailable(null);
            return;
        }

        setCheckingUsername(true);
        try {
            const { data } = await supabase
                .from('users')
                .select('username')
                .eq('username', value.toLowerCase())
                .maybeSingle();

            setUsernameAvailable(!data);
        } catch (err) {
            console.error("Username check error:", err);
        } finally {
            setCheckingUsername(false);
        }
    };

    const handleUsernameChange = (value: string) => {
        const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setUsername(cleaned);

        // Debounce check
        setTimeout(() => checkUsername(cleaned), 500);
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPetPhoto(file);
            setPetPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!name || !email || !password || !username || !petName) {
            setError("Please fill in all required fields");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (!usernameAvailable) {
            setError("Username is not available");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // 1. Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update display name
            await updateProfile(user, { displayName: name });

            // 2. Upload pet photo if provided
            let petPhotoUrl = null;
            if (petPhoto) {
                petPhotoUrl = await uploadToCloudinary(petPhoto);
            }

            // 3. Create user in Supabase
            const { error: userError } = await supabase
                .from('users')
                .insert({
                    id: user.uid,
                    email,
                    name,
                    username: username.toLowerCase(),
                    location,
                    bio,
                });

            if (userError) throw userError;

            // 4. Create primary pet
            const { data: petData, error: petError } = await supabase
                .from('pets')
                .insert({
                    owner_id: user.uid,
                    name: petName,
                    species: petSpecies || null,
                    breed: petBreed || null,
                    age: petAge || null,
                    gender: petGender || null,
                    avatar: petPhotoUrl,
                    bio: petBio || null,
                    is_primary: true,
                    display_order: 0,
                })
                .select()
                .single();

            if (petError) throw petError;

            // 5. Set as primary pet
            const { error: updateError } = await supabase
                .from('users')
                .update({ primary_pet_id: petData.id })
                .eq('id', user.uid);

            if (updateError) throw updateError;

            // Success! Redirect to home
            alert("Account created successfully! Welcome to TingoBingo! 🎉");
            router.push('/');

        } catch (err: any) {
            console.error("Signup error:", err);
            setError(err.message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <div className="bg-white sticky top-0 z-10 px-4 py-3 shadow-sm flex items-center gap-3">
                <Link href="/signup">
                    <button className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </button>
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
            </div>

            <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 space-y-6">
                {/* Section: Owner Information */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Your Information</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="modern-input"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="modern-input"
                                placeholder="john@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="modern-input pr-12"
                                    placeholder="Min. 8 characters"
                                    minLength={8}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                Username <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-gray-400 font-bold">@</span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => handleUsernameChange(e.target.value)}
                                    className="modern-input pl-10 pr-12"
                                    placeholder="yourname"
                                    minLength={3}
                                    maxLength={20}
                                    required
                                />
                                <div className="absolute right-4 top-3">
                                    {checkingUsername && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
                                    {!checkingUsername && usernameAvailable === true && (
                                        <Check className="w-5 h-5 text-green-500" />
                                    )}
                                    {!checkingUsername && usernameAvailable === false && (
                                        <X className="w-5 h-5 text-red-500" />
                                    )}
                                </div>
                            </div>
                            {username.length >= 3 && usernameAvailable === false && (
                                <p className="text-xs text-red-600 mt-1">Username already taken</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Location (Optional)</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="modern-input"
                                placeholder="New York, USA"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Bio (Optional)</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="modern-input"
                                placeholder="Tell us about yourself..."
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                {/* Section: Primary Pet Information */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-sm border-2 border-purple-200">
                    <h2 className="text-lg font-bold text-purple-900 mb-2">Your Pet (Primary Profile)</h2>
                    <p className="text-sm text-purple-700 mb-4">
                        This will be your main profile. You can add more pets later!
                    </p>

                    <div className="space-y-4">
                        {/* Pet Photo */}
                        <div>
                            <label className="block text-sm font-bold text-purple-900 mb-2">Pet Photo (Optional)</label>
                            <div className="flex items-center gap-4">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-purple-300 cursor-pointer hover:border-purple-500 transition-colors overflow-hidden flex items-center justify-center group"
                                >
                                    {petPhotoPreview ? (
                                        <img src={petPhotoPreview} alt="Pet preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera className="w-8 h-8 text-purple-400 group-hover:text-purple-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-purple-700 font-medium mb-1">
                                        {petPhotoPreview ? "Tap to change photo" : "Tap to add photo"}
                                    </p>
                                    <p className="text-xs text-purple-600">
                                        This will be your profile picture
                                    </p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-purple-900 mb-1.5">
                                Pet Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={petName}
                                onChange={(e) => setPetName(e.target.value)}
                                className="modern-input bg-white"
                                placeholder="Max, Bella, etc."
                                required
                            />
                            <p className="text-xs text-purple-600 mt-1">This becomes your profile name</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-purple-900 mb-1.5">Species</label>
                                <select
                                    value={petSpecies}
                                    onChange={(e) => setPetSpecies(e.target.value)}
                                    className="modern-input bg-white"
                                >
                                    <option value="">Select...</option>
                                    <option value="dog">Dog</option>
                                    <option value="cat">Cat</option>
                                    <option value="bird">Bird</option>
                                    <option value="rabbit">Rabbit</option>
                                    <option value="fish">Fish</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-purple-900 mb-1.5">Gender</label>
                                <select
                                    value={petGender}
                                    onChange={(e) => setPetGender(e.target.value)}
                                    className="modern-input bg-white"
                                >
                                    <option value="">Select...</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="unknown">Unknown</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-purple-900 mb-1.5">Breed (Optional)</label>
                                <input
                                    type="text"
                                    value={petBreed}
                                    onChange={(e) => setPetBreed(e.target.value)}
                                    className="modern-input bg-white"
                                    placeholder="Golden Retriever"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-purple-900 mb-1.5">Age (Optional)</label>
                                <input
                                    type="text"
                                    value={petAge}
                                    onChange={(e) => setPetAge(e.target.value)}
                                    className="modern-input bg-white"
                                    placeholder="2 years"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-purple-900 mb-1.5">About Your Pet (Optional)</label>
                            <textarea
                                value={petBio}
                                onChange={(e) => setPetBio(e.target.value)}
                                className="modern-input bg-white"
                                placeholder="Tell us about your furry friend..."
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !usernameAvailable || !petName}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        "Create Account"
                    )}
                </button>

                {/* Login Link */}
                <div className="text-center">
                    <p className="text-gray-600 text-sm">
                        Already have an account?{" "}
                        <Link href="/" className="text-purple-600 font-bold hover:underline">
                            Log In
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );
}
