"use client";

import { useAuth } from "@/context/AuthContext";
import { useSocial } from "@/context/SocialContext";
import CreatePost from "../feed/CreatePost";
import { Settings, Loader2, Heart, MessageCircle, Send, ArrowRight } from "lucide-react";
import HighlightsBar from "./HighlightsBar";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import FollowListModal from "./FollowListModal";

interface Post {
    id: string;
    user_id: string;
    content: string;
    image_url?: string;
    likes_count: number;
    created_at: string;
}

interface ProfileViewProps {
    userId?: string; // If undefined, show current user
}

export default function ProfileView({ userId }: ProfileViewProps) {
    const { user: currentUser, logout, isLoading: authLoading } = useAuth();
    const { addComment } = useSocial();
    const router = useRouter();

    // Determine which user to show
    const targetUserId = userId || currentUser?.id;
    const isMe = currentUser?.id === targetUserId;


    const [profileData, setProfileData] = useState<any>(null);
    const [primaryPet, setPrimaryPet] = useState<any>(null);
    const [allPets, setAllPets] = useState<any[]>([]); // Store all pets
    const [posts, setPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
    const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

    // Follow System State
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    // Follow List Modal State
    const [activeList, setActiveList] = useState<'followers' | 'following' | null>(null);

    // Fetch Profile & Counts
    useEffect(() => {
        if (!targetUserId) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Profile & Primary Pet
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', targetUserId)
                    .maybeSingle();

                if (userError) throw userError;

                if (userData) {
                    setProfileData(userData);

                    // Fetch ALL pets for this user
                    const { data: petsData } = await supabase
                        .from('pets')
                        .select('*')
                        .eq('owner_id', targetUserId)
                        .order('is_primary', { ascending: false }); // Primary first

                    if (petsData) {
                        setAllPets(petsData);
                        // Determine primary pet
                        const primary = petsData.find((p: any) => p.is_primary) || petsData[0];
                        setPrimaryPet(primary);
                    }
                }

                // 2. Fetch Follow Counts
                const { count: followers } = await supabase
                    .from('follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('following_id', targetUserId);

                const { count: following } = await supabase
                    .from('follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('follower_id', targetUserId);

                setFollowersCount(followers || 0);
                setFollowingCount(following || 0);

                // 3. Check if I am following them (only if logged in and not me)
                if (currentUser && !isMe) {
                    const { data: followData } = await supabase
                        .from('follows')
                        .select('*')
                        .eq('follower_id', currentUser.id)
                        .eq('following_id', targetUserId)
                        .maybeSingle();

                    setIsFollowing(!!followData);
                }

            } catch (error) {
                console.error("Error fetching profile data:", error);
            }
        };

        fetchData();

        // Realtime Subscription for Counts
        const channel = supabase
            .channel(`profile-follows-${targetUserId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'follows'
            }, () => {
                // Simplified: just refetch counts for now
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [targetUserId, currentUser, isMe]);

    // Fetch User's Posts
    useEffect(() => {
        if (!targetUserId) return;

        const fetchPosts = async () => {
            setLoadingPosts(true);
            const { data } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false });

            setPosts(data || []);
            setLoadingPosts(false);
        };

        fetchPosts();

        // Subscribe to new posts
        const channel = supabase
            .channel(`profile-posts-${targetUserId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `user_id=eq.${targetUserId}` },
                () => fetchPosts()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [targetUserId]);

    const handleFollow = async () => {
        if (!currentUser || !targetUserId || followLoading) return;
        setFollowLoading(true);

        try {
            if (isFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', currentUser.id)
                    .eq('following_id', targetUserId);

                if (error) throw error;
                setIsFollowing(false);
                setFollowersCount(prev => Math.max(0, prev - 1));
            } else {
                // Follow
                const { error } = await supabase
                    .from('follows')
                    .insert({
                        follower_id: currentUser.id,
                        following_id: targetUserId
                    });

                if (error) throw error;
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
            }
        } catch (error) {
            console.error("Follow action failed:", error);
            alert("Failed to update follow status. Make sure you ran the SQL script!");
        } finally {
            setFollowLoading(false);
        }
    };

    // Loading State
    if (authLoading && !profileData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Display Data
    const displayUser = {
        name: profileData?.name || (isMe ? currentUser?.name : "User"),
        avatar: profileData?.avatar || (isMe ? currentUser?.avatar : "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"),
        bio: profileData?.bio || "No bio yet.",
        location: profileData?.location || "Earth"
    };

    const displayPet = primaryPet ? {
        name: primaryPet.name,
        avatar: primaryPet.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${primaryPet.name}`,
        bio: primaryPet.bio || "No bio yet",
        species: primaryPet.species || "Pet",
        breed: primaryPet.breed,
        age: primaryPet.age,
        gender: primaryPet.gender
    } : null;

    // Use Pet Avatar as main profile pic if available (Pet-centric app), or keep User?
    // Sketch shows "Photo". Usually main profile pic. If app is "The Pet's Social", maybe Pet Pic?
    // Let's stick to User Avatar as main for now, but show Pet prominently.
    // actually, let's allow the "Cover" to vary or stick to user avatar. 
    // Sketch shows: Top: Photo. Below: Bio. Then Info Boxes.

    // Let's use User's Avatar as the main circle, but make it clear.

    return (
        <div className="pb-24 bg-[#F8F9FA] min-h-screen">
            {/* Cover Image */}
            <div className="h-64 bg-gray-200 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-0"></div>
                <img src={displayUser.avatar} className="w-full h-full object-cover blur-sm opacity-50" alt="Cover" />
                {isMe && (
                    <Link href="/settings" className="absolute top-6 right-6 bg-white/20 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white/30 transition-colors z-10">
                        <Settings className="w-5 h-5" />
                    </Link>
                )}
            </div>

            {/* Profile Info */}
            <div className="px-6 relative -mt-24 z-10 pb-10 flex flex-col items-center">
                <div className="flex flex-col items-center mb-4">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 mb-4">
                        <img src={displayUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">{displayUser.name}</h1>
                </div>

                {/* Main Bio Section - Full Width */}
                {displayUser.bio && (
                    <div className="w-full max-w-2xl mt-6 text-center">
                        <p className="text-gray-800 text-lg leading-relaxed font-medium">
                            {displayUser.bio}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                    {isMe ? (
                        <Link href="/profile/edit">
                            <button className="bg-white px-6 py-2.5 rounded-full text-sm font-bold shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Edit Profile
                            </button>
                        </Link>
                    ) : (
                        <>
                            <button
                                onClick={handleFollow}
                                disabled={followLoading}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all flex items-center gap-2 ${isFollowing
                                    ? 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
                                    : 'bg-black text-white hover:bg-gray-900 shadow-purple-500/20'
                                    }`}
                            >
                                {followLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isFollowing ? (
                                    "Following"
                                ) : (
                                    "Follow"
                                )}
                            </button>

                            <Link href={`/chat?user=${targetUserId}`}>
                                <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl hover:shadow-pink-500/20 transition-all flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4" />
                                    Message
                                </button>
                            </Link>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-center gap-8 mt-6 mb-8 bg-white/80 backdrop-blur-md px-8 py-3 rounded-full shadow-sm border border-gray-100 ring-1 ring-gray-50">
                    <div
                        onClick={() => setActiveList('followers')}
                        className="text-center group cursor-pointer hover:opacity-75 transition-opacity"
                    >
                        <span className="block font-black text-xl text-gray-900 leading-none mb-1">{followersCount}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Followers</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div
                        onClick={() => setActiveList('following')}
                        className="text-center group cursor-pointer hover:opacity-75 transition-opacity"
                    >
                        <span className="block font-black text-xl text-gray-900 leading-none mb-1">{followingCount}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Following</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="text-center group cursor-pointer hover:opacity-75 transition-opacity">
                        <span className="block font-black text-xl text-gray-900 leading-none mb-1">{posts.length}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Posts</span>
                    </div>
                </div>

                <FollowListModal
                    userId={targetUserId!}
                    type={activeList || 'followers'}
                    isOpen={!!activeList}
                    onClose={() => setActiveList(null)}
                />

                {/* Info Boxes: Pet vs Owner */}
                <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl mt-8">
                    {/* Pet Info Card (Tabs for Multiple Pets) */}
                    <div className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-orange-100 ring-1 ring-orange-50 relative group flex flex-col">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-gray-900">Pet Info</h3>
                            </div>
                            {isMe && (
                                <Link href="/profile/edit" className="text-gray-400 hover:text-orange-500 transition-colors">
                                    <Settings className="w-4 h-4" />
                                </Link>
                            )}
                        </div>

                        {/* Pet Selector Tabs */}
                        {allPets.length > 1 && (
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                                {allPets.map((pet) => (
                                    <button
                                        key={pet.id}
                                        onClick={() => setPrimaryPet(pet)} // We reuse setPrimaryPet to control the view for now, or nice to have a separate state. 
                                        // Actually, let's use a local state for the VIEW only, but the user expects to see 'details'. 
                                        // The component uses 'displayPet' derived from 'primaryPet'. 
                                        // So updating 'primaryPet' state technically works for the view, even if it doesn't change the DB primary.
                                        // Let's stick to using setPrimaryPet for the UI view to avoid new state if possible, 
                                        // OR better: create a separate state 'viewPet' to avoid confusion with the actual 'primary' concept.
                                        className={`relative flex-shrink-0 transition-all ${displayPet?.name === pet.name
                                            ? 'opacity-100 scale-110'
                                            : 'opacity-50 hover:opacity-100'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full overflow-hidden border ${displayPet?.name === pet.name ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-200'}`}>
                                            <img
                                                src={pet.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${pet.name}`}
                                                className="w-full h-full object-cover"
                                                alt={pet.name}
                                            />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {displayPet ? (
                            <div className="space-y-3 text-sm flex-1">
                                <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg">
                                    <span className="text-gray-500">Name</span>
                                    <span className="font-bold text-gray-900">{displayPet.name}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 pb-1">
                                    <span className="text-gray-500">Species</span>
                                    <span className="font-medium text-gray-900 capitalize">{displayPet.species}</span>
                                </div>
                                {displayPet.breed && (
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-1">
                                        <span className="text-gray-500">Breed</span>
                                        <span className="font-medium text-gray-900">{displayPet.breed}</span>
                                    </div>
                                )}
                                {displayPet.age && (
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-1">
                                        <span className="text-gray-500">Age</span>
                                        <span className="font-medium text-gray-900">{displayPet.age}</span>
                                    </div>
                                )}
                                {displayPet.gender && displayPet.gender !== 'unknown' && (
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-1">
                                        <span className="text-gray-500">Gender</span>
                                        <span className="font-medium text-gray-900 capitalize">{displayPet.gender}</span>
                                    </div>
                                )}
                                <div className="mt-2 pt-2 text-center">
                                    <Link href={`/pets/${primaryPet.id}`} className="text-xs font-bold text-orange-500 hover:underline flex items-center justify-center gap-1">
                                        View Full Profile <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 italic">No pet info added yet.</p>
                        )}
                    </div>

                    {/* Owner Card */}
                    <div className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-gray-900">Owner Info</h3>
                            </div>
                            {isMe && (
                                <Link href="/profile/edit" className="text-gray-400 hover:text-gray-900 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                </Link>
                            )}
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Name</span>
                                <span className="font-medium text-gray-900">{displayUser.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Location</span>
                                <span className="font-medium text-gray-900">{displayUser.location}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Since</span>
                                <span className="font-medium text-gray-900">
                                    {profileData?.created_at ? new Date(profileData.created_at).getFullYear() : new Date().getFullYear()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Highlights Bar */}
            <div className="mb-6">
                <HighlightsBar userId={targetUserId!} isMe={isMe} />
            </div>

            {/* Pets Grid (Restored Feature) */}
            {allPets.length > 0 && (
                <div className="px-6 mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Their Pets ({allPets.length})</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {allPets.map((pet) => (
                            <Link key={pet.id} href={`/pets/${pet.id}`}>
                                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
                                    <div className="w-full aspect-square rounded-xl bg-gray-100 overflow-hidden mb-3 relative">
                                        <img
                                            src={pet.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${pet.name}`}
                                            alt={pet.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        {pet.is_primary && (
                                            <div className="absolute top-2 right-2 bg-yellow-400 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                                STAR
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-gray-900">{pet.name}</h3>
                                    <p className="text-xs text-gray-500 capitalize">{pet.species}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Posts Feed for User */}
            <div className="flex items-center justify-between mb-4 px-2 mt-8">
                <h2 className="text-lg font-bold text-gray-900">Latest Posts</h2>
            </div>

            <div className="flex flex-col gap-6">
                {/* Create Post Widget (Only for me) */}
                {isMe && (
                    <div className="mb-2">
                        <CreatePost />
                    </div>
                )}

                {loadingPosts ? (
                    <div className="p-12 text-center text-gray-400">Loading posts...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center text-gray-400 py-12 bg-white rounded-3xl border border-gray-100">
                        No posts yet.
                    </div>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            {post.image_url && (
                                <div className="relative w-full bg-gray-100">
                                    <img src={post.image_url} alt="Post" className="w-full object-contain max-h-[500px]" />
                                </div>
                            )}
                            <div className="p-5">
                                <p className="text-gray-900 mb-3 leading-relaxed">{post.content}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500 fill-red-500" /> {post.likes_count}</span>
                                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

    );
}
