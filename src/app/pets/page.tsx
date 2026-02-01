"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, Loader2, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

interface Pet {
    id: string;
    owner_id: string;
    name: string;
    species: string;
    breed?: string;
    age?: string;
    gender?: string;
    avatar?: string;
    bio?: string;
    created_at: string;
}

export default function PetsPage() {
    const { user } = useAuth();
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchPets = async () => {
            try {
                const { data, error } = await supabase
                    .from('pets')
                    .select('*')
                    .eq('owner_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setPets(data || []);
            } catch (error) {
                console.error("Error fetching pets:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPets();
    }, [user]);

    const handleDelete = async (petId: string, petName: string) => {
        if (!confirm(`Are you sure you want to remove ${petName}?`)) return;

        try {
            const { error } = await supabase
                .from('pets')
                .delete()
                .eq('id', petId)
                .eq('owner_id', user?.id); // Extra safety check

            if (error) throw error;

            setPets(prev => prev.filter(p => p.id !== petId));
            alert(`${petName} removed successfully.`);
        } catch (error: any) {
            console.error("Error deleting pet:", error);
            alert(`Failed to delete pet: ${error.message}`);
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
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white sticky top-0 z-10 px-4 py-3 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/profile" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">My Pets</h1>
                </div>
                <Link href="/pets/add">
                    <button className="bg-black text-white p-2 rounded-full shadow-lg hover:bg-gray-800 transition-colors">
                        <Plus className="w-5 h-5" />
                    </button>
                </Link>
            </header>

            <main className="max-w-lg mx-auto p-6">
                {loading ? (
                    <div className="text-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-500">Loading your pets...</p>
                    </div>
                ) : pets.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <span className="text-4xl">🐾</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Pets Yet</h2>
                        <p className="text-gray-500 mb-6">Add your first pet to get started!</p>
                        <Link href="/pets/add">
                            <button className="bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-colors">
                                <Plus className="w-5 h-5 inline-block mr-2" />
                                Add Your First Pet
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pets.map(pet => (
                            <div key={pet.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                                {/* Pet Avatar */}
                                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                    <img
                                        src={pet.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pet.name}`}
                                        alt={pet.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Pet Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 text-lg">{pet.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {pet.species} {pet.breed && `• ${pet.breed}`} {pet.age && `• ${pet.age}`}
                                    </p>
                                    {pet.gender && (
                                        <span className="text-xs text-gray-400">{pet.gender}</span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <Link href={`/pets/${pet.id}/edit`}>
                                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                                            <Edit className="w-5 h-5" />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(pet.id, pet.name)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
