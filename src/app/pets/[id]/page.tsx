"use client";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Loader2, Heart, PawPrint } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import CreatePost from "@/components/feed/CreatePost";

export default function PetProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user: currentUser } = useAuth(); // Hook call inside component

    const [pet, setPet] = useState<any>(null);
    const [owner, setOwner] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPetData = async () => {
            try {
                // 1. Fetch Pet Details
                const { data: petData, error: petError } = await supabase
                    .from('pets')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (petError) throw petError;
                setPet(petData);

                // 2. Fetch Owner Details
                if (petData.owner_id) {
                    const { data: ownerData } = await supabase
                        .from('users')
                        .select('id, name, username, avatar')
                        .eq('id', petData.owner_id)
                        .single();
                    setOwner(ownerData);
                }

                // 3. Fetch Posts SPECIFIC to this Pet
                const { data: postsData } = await supabase
                    .from('posts')
                    .select('*')
                    .eq('pet_id', id)
                    .order('created_at', { ascending: false });

                setPosts(postsData || []);

            } catch (error) {
                console.error("Error fetching pet data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPetData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!pet) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] flex-col p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Pet Not Found</h2>
                <Link href="/profile">
                    <button className="text-purple-600 font-bold hover:underline">Go Home</button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-20">
            {/* Header */}
            <div className="bg-white sticky top-0 z-20 px-4 py-3 shadow-sm flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-lg font-bold text-gray-900 leading-tight">{pet.name}</h1>
                    <span className="text-xs text-gray-500 capitalize">{pet.species} • {pet.breed || 'Mixed'}</span>
                </div>
            </div>

            {/* Pet Hero Section */}
            <div className="relative">
                {/* Background Blur */}
                <div className="h-48 bg-gray-900 overflow-hidden">
                    <img
                        src={pet.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${pet.name}`}
                        className="w-full h-full object-cover opacity-50 blur-md"
                        alt="Background"
                    />
                </div>

                {/* Pet Card */}
                <div className="px-6 -mt-16 relative z-10">
                    <div className="bg-white rounded-3xl shadow-lg p-6 flex flex-col items-center border border-gray-100">
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-gray-100 overflow-hidden mb-4">
                            <img
                                src={pet.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${pet.name}`}
                                className="w-full h-full object-cover"
                                alt={pet.name}
                            />
                        </div>

                        <h1 className="text-2xl font-black text-gray-900 mb-1">{pet.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <span className="capitalize bg-gray-100 px-3 py-1 rounded-full font-medium">{pet.species}</span>
                            {pet.age && <span>{pet.age} old</span>}
                        </div>

                        {pet.bio && (
                            <p className="text-center text-gray-600 mb-6 font-medium italic">"{pet.bio}"</p>
                        )}

                        {/* Owner Link */}
                        {owner && (
                            <Link href={`/user/${owner.id}`} className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors w-full">
                                <img src={owner.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${owner.id}`} className="w-10 h-10 rounded-full object-cover" alt={owner.name} />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Loved by</p>
                                    <p className="text-sm font-bold text-gray-900">{owner.name}</p>
                                </div>
                                <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Post Widget (For Owner) */}
            {currentUser && pet.owner_id === currentUser.id && (
                <div className="px-4 mt-6 mb-2">
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-2xl border border-orange-100">
                        <p className="text-sm font-bold text-orange-800 mb-2">Post as {pet.name}</p>
                        <CreatePost petId={pet.id} />
                    </div>
                </div>
            )}

            {/* Posts Grid */}
            <div className="px-4 mt-8">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Photos of {pet.name}</h2>
                    <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{posts.length}</span>
                </div>

                {posts.length > 0 ? (
                    <div className="masonry-grid grid grid-cols-2 gap-3">
                        {posts.map((post) => (
                            <div key={post.id} className="mb-3 break-inside-avoid">
                                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 group relative cursor-pointer">
                                    {post.image_url ? (
                                        <img src={post.image_url} className="w-full h-auto object-cover" alt="Post" />
                                    ) : (
                                        <div className="p-4 bg-gray-50 text-xs text-gray-600 text-center min-h-[100px] flex items-center justify-center">
                                            {post.content}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-1">
                                        <Heart className="w-4 h-4 fill-white" /> {post.likes_count || 0}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <PawPrint className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">No photos of {pet.name} yet!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
