"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface GameScore {
    id: string;
    game_id: string;
    score: number;
    user: {
        name: string;
        avatar: string;
    };
}

interface GameContextType {
    coins: number;
    addCoins: (amount: number) => Promise<void>;
    submitScore: (gameId: string, score: number) => Promise<void>;
    getLeaderboard: (gameId: string) => Promise<GameScore[]>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [coins, setCoins] = useState(0);

    // Fetch initial coins
    useEffect(() => {
        if (!user) return;
        const fetchCoins = async () => {
            const { data, error } = await supabase
                .from('users')
                .select('coins')
                .eq('id', user.id)
                .single();

            if (data) setCoins(data.coins || 0);
        };
        fetchCoins();
    }, [user]);

    const addCoins = async (amount: number) => {
        if (!user) return;
        const newBalance = coins + amount;
        setCoins(newBalance); // Optimistic update

        const { error } = await supabase
            .from('users')
            .update({ coins: newBalance })
            .eq('id', user.id);

        if (error) {
            console.error("Failed to update coins", error);
            setCoins(coins); // Revert
        }
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
        <GameContext.Provider value={{ coins, addCoins, submitScore, getLeaderboard }}>
            {children}
        </GameContext.Provider>
    );
}

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within a GameProvider");
    return context;
};
