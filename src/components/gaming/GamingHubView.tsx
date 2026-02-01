"use client";

import { Trophy, Gamepad2 } from "lucide-react";

export default function GamingHubView() {
    const leaderboard: any[] = [];

    return (
        <div className="pb-24 p-4 min-h-screen bg-gray-50">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">
                        Pet Arcade
                    </h1>
                    <p className="text-sm font-medium text-gray-500">Play & Win Treat Points!</p>
                </div>
                <div className="bg-white p-2 rounded-xl shadow-sm">
                    <Gamepad2 className="w-8 h-8 text-orange-500" />
                </div>
            </header>

            {/* Featured Game */}
            <div className="bg-gray-900 text-white p-6 rounded-3xl relative overflow-hidden mb-8 shadow-2xl">
                <div className="relative z-10">
                    <span className="inline-block px-3 py-1 bg-red-500 rounded-full text-[10px] font-bold uppercase tracking-wide mb-2">Live Contest</span>
                    <h2 className="text-2xl font-bold mb-2">Catch the Lazr</h2>
                    <p className="text-gray-300 mb-6 text-sm max-w-[80%]">Use your paw to catch the dot! High score wins a premium squeaky toy.</p>
                    <button className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-lg">
                        Play Now
                    </button>
                </div>

                {/* Abstract Background Decoration */}
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute top-10 right-10 w-20 h-20 bg-blue-500 rounded-full blur-2xl opacity-30"></div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <h3 className="font-bold text-lg text-gray-800">Global Leaderboard</h3>
                </div>

                {leaderboard.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        <p>Be the first to set a high score!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Rankings */}
                    </div>
                )}
            </div>
        </div>
    );
}
