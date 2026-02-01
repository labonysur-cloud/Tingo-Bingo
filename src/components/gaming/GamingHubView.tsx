"use client";

import { useState, useEffect } from "react";
import { Trophy, Gamepad2, Coins, Play, Star } from "lucide-react";
import { GameProvider, useGame } from "@/context/GameContext";
import CatchTheLazr from "./CatchTheLazr";
import TingoJump from "./TingoJump";

function GamingHubContent() { // Inner component to use context
    const { coins, getLeaderboard } = useGame();
    const [activeGame, setActiveGame] = useState<string | null>(null);
    const [leaderboards, setLeaderboards] = useState<any>({});
    const [loadingLB, setLoadingLB] = useState(true);

    useEffect(() => {
        const fetchLB = async () => {
            setLoadingLB(true);
            const lazr = await getLeaderboard('catch-lazr');
            const jump = await getLeaderboard('tingo-jump');
            setLeaderboards({ 'catch-lazr': lazr, 'tingo-jump': jump });
            setLoadingLB(false);
        };
        fetchLB();
    }, [activeGame]); // Refresh when closing a game

    return (
        <div className="pb-24 p-4 min-h-screen bg-[#F0F2F5]">
            {/* Header */}
            <header className="mb-6 flex justify-between items-center sticky top-0 z-10 bg-[#F0F2F5]/90 backdrop-blur-md py-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">
                        Pet Arcade
                    </h1>
                    <p className="text-sm font-medium text-gray-500">Play, Win, & Collect Treats!</p>
                </div>

                {/* Coin Balance */}
                <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Treats</span>
                        <span className="block text-xl font-black text-gray-900 leading-none">{coins.toLocaleString()}</span>
                    </div>
                </div>
            </header>

            {/* Game Launchers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                {/* Tingo Jump Card */}
                <div
                    onClick={() => setActiveGame('tingo-jump')}
                    className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white p-6 rounded-3xl relative overflow-hidden shadow-xl cursor-pointer group hover:scale-[1.02] transition-all"
                >
                    <div className="relative z-10">
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-[10px] font-bold uppercase tracking-wide mb-3 border border-white/20">Featured</span>
                        <h2 className="text-3xl font-black mb-2 italic">TINGO JUMP</h2>
                        <p className="text-blue-50 mb-6 text-sm font-medium max-w-[80%]">Bounce to the moon! Collect coins and avoid obstacles in this infinite jumper.</p>
                        <button className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg flex items-center gap-2">
                            <Play className="w-4 h-4 fill-current" /> Play Now
                        </button>
                    </div>
                    {/* Decor */}
                    <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>
                    <Star className="absolute top-4 right-4 text-yellow-300 w-8 h-8 animate-spin-slow opacity-80" />
                </div>

                {/* Catch the Lazr Card */}
                <div
                    onClick={() => setActiveGame('catch-lazr')}
                    className="bg-gray-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-xl cursor-pointer group hover:scale-[1.02] transition-all"
                >
                    <div className="relative z-10">
                        <span className="inline-block px-3 py-1 bg-red-500 rounded-full text-[10px] font-bold uppercase tracking-wide mb-3">Live Contest</span>
                        <h2 className="text-3xl font-black mb-2 text-red-500">CATCH THE LAZR</h2>
                        <p className="text-gray-400 mb-6 text-sm font-medium max-w-[80%]">Test your reflex! Tap the red dot before it disappears.</p>
                        <button className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg flex items-center gap-2">
                            <Play className="w-4 h-4 fill-current" /> Play Now
                        </button>
                    </div>
                    <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-red-600/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 group-hover:bg-red-600/30 transition-all"></div>
                </div>
            </div>

            {/* Leaderboards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['tingo-jump', 'catch-lazr'].map(gameId => (
                    <div key={gameId} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                            <Trophy className={`w-6 h-6 ${gameId === 'tingo-jump' ? 'text-blue-500' : 'text-red-500'}`} />
                            <h3 className="font-bold text-lg text-gray-800 capitalize">{gameId.replace('-', ' ')} Top Players</h3>
                        </div>

                        {loadingLB ? (
                            <div className="text-center py-8 text-gray-300 animate-pulse">Loading scores...</div>
                        ) : (leaderboards[gameId] || []).length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                <p>No scores yet. Be the first!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(leaderboards[gameId] || []).map((entry: any, idx: number) => (
                                    <div key={entry.id} className="flex items-center gap-4">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-800' : 'text-gray-400'}`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 flex items-center gap-3">
                                            <img src={entry.user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"} className="w-10 h-10 rounded-full bg-gray-100 object-cover" />
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{entry.user?.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-400">Rank #{idx + 1}</p>
                                            </div>
                                        </div>
                                        <div className="font-black text-gray-900 text-lg">
                                            {entry.score}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Active Game Modal */}
            {activeGame === 'catch-lazr' && <CatchTheLazr onClose={() => setActiveGame(null)} />}
            {activeGame === 'tingo-jump' && <TingoJump onClose={() => setActiveGame(null)} />}

        </div>
    );
}

export default function GamingHubView() {
    return (
        <GameProvider>
            <GamingHubContent />
        </GameProvider>
    );
}

