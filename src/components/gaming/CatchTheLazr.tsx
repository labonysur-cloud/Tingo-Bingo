"use client";

import { useEffect, useState, useRef } from "react";
import { useGame } from "@/context/GameContext";
import { X, Play, Trophy } from "lucide-react";

export default function CatchTheLazr({ onClose }: { onClose: () => void }) {
    const { addCoins, submitScore } = useGame();
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isPlaying, setIsPlaying] = useState(false);
    const [dotPosition, setDotPosition] = useState({ top: "50%", left: "50%" });
    const [showGame, setShowGame] = useState(false); // Intro screen vs game

    const containerRef = useRef<HTMLDivElement>(null);

    // Game Timer
    useEffect(() => {
        if (!isPlaying) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPlaying]);

    const startGame = () => {
        setScore(0);
        setTimeLeft(30);
        setIsPlaying(true);
        moveDot();
    };

    const endGame = async () => {
        setIsPlaying(false);
        // Calculate coins: 1 coin every 5 points
        const coinsEarned = Math.floor(score / 5);
        if (coinsEarned > 0) await addCoins(coinsEarned);
        await submitScore('catch-lazr', score);
    };

    const moveDot = () => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            // Keep roughly within bounds
            const x = Math.random() * (width - 60);
            const y = Math.random() * (height - 60);
            setDotPosition({ top: `${y}px`, left: `${x}px` });
        }
    };

    const handleDotClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isPlaying) return;
        setScore(prev => prev + 1);

        // Play simple beep or visual effect
        // Visual Ripple could be added here

        moveDot();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-gray-900 w-full max-w-4xl aspect-video rounded-3xl relative overflow-hidden border-4 border-red-500/50 shadow-2xl flex flex-col">

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 pointer-events-none">
                    <div className="bg-black/50 backdrop-blur px-6 py-2 rounded-full border border-white/10">
                        <span className="text-red-400 font-black text-2xl tracking-widest">SCORE: {score}</span>
                    </div>

                    <div className="flex gap-4 pointer-events-auto">
                        <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-white font-mono font-bold text-xl">
                            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                        </div>
                        <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all">
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Game Area */}
                <div
                    ref={containerRef}
                    className="flex-1 relative cursor-crosshair active:cursor-grabbing bg-[url('https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"
                    onClick={() => {
                        // Miss penalty? No, just fun.
                    }}
                >
                    <div className="absolute inset-0 bg-black/40"></div> {/* Dimmer */}

                    {!isPlaying && timeLeft === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/80 backdrop-blur-sm animate-in fade-in">
                            <Trophy className="w-20 h-20 text-yellow-400 mb-4 animate-bounce" />
                            <h2 className="text-5xl font-black text-white mb-2">TIME UP!</h2>
                            <p className="text-2xl text-gray-300 mb-8">Score: <span className="text-white font-bold">{score}</span></p>
                            <div className="flex gap-4">
                                <button
                                    onClick={startGame}
                                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-bold text-xl transform hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <Play className="fill-current" /> Play Again
                                </button>
                                <button
                                    onClick={onClose}
                                    className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-bold text-xl transform hover:scale-105 transition-all"
                                >
                                    Exit
                                </button>
                            </div>
                        </div>
                    )}

                    {!isPlaying && timeLeft === 30 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/60 backdrop-blur-sm">
                            <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 mb-8 text-center drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                                CATCH THE LAZR
                            </h2>
                            <button
                                onClick={startGame}
                                className="bg-white text-red-600 px-10 py-5 rounded-full font-black text-2xl shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] transform hover:scale-110 transition-all flex items-center gap-3"
                            >
                                <Play className="w-8 h-8 fill-current" /> START GAME
                            </button>
                            <p className="text-gray-400 mt-6 font-medium tracking-wide">Tap the red dot as fast as you can!</p>
                        </div>
                    )}

                    {/* THE DOT */}
                    {isPlaying && (
                        <div
                            className="absolute w-16 h-16 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-100 ease-out active:scale-95 group"
                            style={{ top: dotPosition.top, left: dotPosition.left }}
                            onClick={handleDotClick}
                        >
                            {/* Inner Glow */}
                            <div className="absolute inset-0 bg-red-500 rounded-full blur-sm group-hover:blur-md transition-all animate-pulse"></div>
                            {/* Core */}
                            <div className="absolute inset-2 bg-white rounded-full opacity-80 shadow-[0_0_20px_rgba(255,0,0,0.8)]"></div>
                            {/* Ring */}
                            <div className="absolute -inset-4 border-2 border-red-500/30 rounded-full animate-ping"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
