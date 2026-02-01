"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Loader2, MessageCircle, MapPin, Calendar, AtSign, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserProfile {
    id: string;
    username: string | null;
    name: string;
    avatar: string | null;
    bio: string | null;
    location: string | null;
    created_at: string;
}

interface Pet {
    id: string;
    name: string;
    species: string;
    avatar: string | null;
}

export default function PublicUserProfile({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params Promise (Next.js 15+)
    const { id } = use(params);

    const { user: currentUser } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [pets, setPets] = useState<Pet[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Redirect if viewing own profile
    useEffect(() => {
        if (currentUser && id === currentUser.id) {
            router.replace('/profile');
        }
    }, [currentUser, id, router]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                // Fetch user profile
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (userError) throw userError;
                setProfile(userData);

                // Fetch user's pets
                const { data: petsData, error: petsError } = await supabase
                    .from('pets')
                    .select('id, name, species, avatar')
                    .eq('owner_id', id);

                if (!petsError) {
                    setPets(petsData || []);
                }

                // Fetch user's posts
                const { data: postsData, error: postsError } = await supabase
                    .from('posts')
                    .select('id, content, image_url, likes_count, created_at')
                    .eq('user_id', id)
                    .order('created_at', { ascending: false });

                if (!postsError) {
                    setPosts(postsData || []);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">User Not Found</h2>
                    <p className="text-gray-500 mb-6">This user doesn't exist or has been removed.</p>
                    <Link href="/search">
                        <button className="bg-black text-white px-6 py-3 rounded-xl font-bold">
                            Back to Search
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const isOwnProfile = currentUser?.id === id;
    const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
    });

    return (
        <div className="pb-24 bg-[#F8F9FA] min-h-screen">
            {/* Header */}
            <div className="bg-white sticky top-0 z-10 px-4 py-3 shadow-sm flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Profile</h1>
            </div>

            {/* Cover & Avatar */}
            <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400 relative">
                {profile.avatar && (
                    <img
                        src={profile.avatar}
                        className="w-full h-full object-cover blur-sm opacity-50"
                        alt="Cover"
                    />
                )}
            </div>

            {/* Profile Content */}
            <div className="px-6 relative -mt-16 z-10 pb-10">
                {/* Avatar */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 mb-4">
                        <img
                            src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`}
                            alt={profile.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <h1 className="text-3xl font-extrabold text-gray-900">{profile.name}</h1>

                    {profile.username && (
                        <div className="flex items-center gap-1 text-purple-600 font-medium mt-1">
                            <AtSign className="w-4 h-4" />
                            <span>@{profile.username}</span>
                        </div>
                    )}

                    {profile.bio && (
                        <p className="text-gray-500 text-center text-sm mt-2 max-w-xs">{profile.bio}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4">
                        {isOwnProfile ? (
                            <Link href="/profile/edit">
                                <button className="bg-white px-4 py-2 rounded-full text-sm font-bold shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                                    Edit Profile
                                </button>
                            </Link>
                        ) : (
                            <Link href={`/messages?user=${id}`}>
                                <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4" />
                                    Message
                                </button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {/* Location */}
                    {profile.location && (
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <MapPin className="w-4 h-4" />
                                <span className="text-xs uppercase font-bold">Location</span>
                            </div>
                            <p className="font-medium text-gray-800">{profile.location}</p>
                        </div>
                    )}

                    {/* Joined */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs uppercase font-bold">Joined</span>
                        </div>
                        <p className="font-medium text-gray-800">{joinDate}</p>
                    </div>
                </div>

                {/* Pets Section */}
                {pets.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Their Pets ({pets.length})</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {pets.map((pet) => (
                                <div key={pet.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                    <div className="w-full aspect-square rounded-xl bg-gray-100 overflow-hidden mb-3">
                                        <img
                                            src={pet.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pet.id}`}
                                            alt={pet.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{pet.name}</h3>
                                    <p className="text-xs text-gray-500">{pet.species}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Posts Section */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Posts ({posts.length})</h2>
                    {posts.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {posts.map((post) => (
                                <div key={post.id} className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative group cursor-pointer">
                                    {post.image_url ? (
                                        <img
                                            src={post.image_url}
                                            alt="Post"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center p-3 bg-white">
                                            <p className="text-xs text-gray-600 line-clamp-4 text-center">
                                                {post.content}
                                            </p>
                                        </div>
                                    )}
                                    {/* Hover overlay with likes */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="flex items-center gap-1 text-white font-bold">
                                            <Heart className="w-5 h-5 fill-current" />
                                            <span>{post.likes_count || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-sm">No posts yet</p>
                        </div>
                    )}
                </div>

                {pets.length === 0 && !isOwnProfile && posts.length === 0 && (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm">No content yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
