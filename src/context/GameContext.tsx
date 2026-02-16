"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface GameScore {
    id: string;
    game_id: string;
    score: number;
    user: {
        name: string;
        avatar: string;
    };
}

export interface VirtualPet {
    id: string;
    name: string;
    type: 'cat' | 'dog' | 'rabbit' | 'bird';
    hunger: number;
    happiness: number;
    energy: number;
    health: number;
    coins: number;
    stage: 'baby' | 'child' | 'adult';
    status?: 'idle' | 'sleeping' | 'sick';
    experience: number;

    created_at: string;
}

interface GameContextType {
    coins: number;
    addCoins: (amount: number) => Promise<void>;
    submitScore: (gameId: string, score: number) => Promise<void>;
    getLeaderboard: (gameId: string) => Promise<GameScore[]>;

    // Pet Logic
    pet: VirtualPet | null;
    adoptPet: (name: string, type: 'cat' | 'dog' | 'rabbit' | 'bird') => Promise<void>;
    feedPet: () => Promise<void>;
    playWithPet: () => Promise<void>;
    petSleep: () => Promise<void>;
    healPet: () => Promise<void>;
    loading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [coins, setCoins] = useState(0);
    const [pet, setPet] = useState<VirtualPet | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch initial coins and Pet
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch user coins
                const { data: userData } = await supabase
                    .from('users')
                    .select('coins')
                    .eq('id', user.id)
                    .single();
                if (userData) setCoins(userData.coins || 0);

                // Fetch Pet
                const { data: petData } = await supabase
                    .from('virtual_pets')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (petData) {
                    setPet(petData as VirtualPet);
                    // Calculates decay based on last interaction (Simplified version for now)
                    // TODO: Implement decay logic here
                }
            } catch (error) {
                console.error("Error fetching game data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const addCoins = async (amount: number) => {
        if (!user) return;
        const newBalance = coins + amount;
        setCoins(newBalance);

        // Update in Users table
        await supabase.from('users').update({ coins: newBalance }).eq('id', user.id);

        // Also update in pets table if pet exists (sync wallets)
        if (pet) {
            await supabase.from('virtual_pets').update({ coins: newBalance }).eq('id', pet.id);
            setPet(prev => prev ? { ...prev, coins: newBalance } : null);
        }
    };

    const adoptPet = async (name: string, type: 'cat' | 'dog' | 'rabbit' | 'bird') => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('virtual_pets')
                .insert({
                    user_id: user.id,
                    name,
                    type,
                    coins: coins
                })
                .select()
                .single();

            if (error) throw error;
            setPet(data as VirtualPet);
        } catch (error) {
            console.error("Adoption failed:", error);
            throw error;
        }
    };

    const updatePetStats = async (updates: Partial<VirtualPet>) => {
        if (!pet || !user) return;

        // Optimistic
        setPet(prev => prev ? { ...prev, ...updates } : null);

        const { error } = await supabase
            .from('virtual_pets')
            .update(updates)
            .eq('id', pet.id);

        if (error) {
            console.error("Failed to update pet:", error);
            // Revert would go here
        }
    };

    const feedPet = async () => {
        if (!pet) return;
        const cost = 10;
        if (coins < cost) return;

        addCoins(-cost); // Deduct coins
        await updatePetStats({
            hunger: Math.min(pet.hunger + 30, 100),
            happiness: Math.min(pet.happiness + 5, 100),
            experience: pet.experience + 10
        });
    };

    const playWithPet = async () => {
        if (!pet) return;
        await updatePetStats({
            happiness: Math.min(pet.happiness + 20, 100),
            hunger: Math.max(pet.hunger - 10, 0),
            energy: Math.max(pet.energy - 15, 0),
            experience: pet.experience + 15
        });
    };

    const petSleep = async () => {
        if (!pet) return;
        await updatePetStats({
            energy: 100,
            hunger: Math.max(pet.hunger - 20, 0)
        });
    };

    const healPet = async () => {
        if (!pet) return;
        const cost = 50;
        if (coins < cost) return;

        addCoins(-cost);
        await updatePetStats({
            health: 100,
            happiness: Math.max(pet.happiness - 10, 0)
        });
    };

    const submitScore = async (gameId: string, score: number) => {
        if (!user) return;
        await supabase.from('game_scores').insert({
            user_id: user.id,
            game_id: gameId,
            score: score
        });
    };

    const getLeaderboard = async (gameId: string) => {
        const { data } = await supabase
            .from('game_scores')
            .select(`
                id, score, game_id,
                user:users (name, avatar)
            `)
            .eq('game_id', gameId)
            .order('score', { ascending: false })
            .limit(10);

        return (data || []) as any[];
    };

    return (
        <GameContext.Provider value={{
            coins, addCoins, submitScore, getLeaderboard,
            pet, adoptPet, feedPet, playWithPet, petSleep, healPet, loading
        }}>
            {children}
        </GameContext.Provider>
    );
}

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within a GameProvider");
    return context;
};
