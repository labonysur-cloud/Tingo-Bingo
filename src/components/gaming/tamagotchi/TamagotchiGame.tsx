"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/context/GameContext";
import { Heart, Zap, Utensils, Gamepad2, Moon, Pill, Coins, RefreshCw } from "lucide-react";
import PixelCat from "./PixelCat";
import ParticleEffect from "./ParticleEffect";
import { motion, AnimatePresence } from "framer-motion";

export default function TamagotchiGame({ onClose }: { onClose: () => void }) {
    const { pet, adoptPet, feedPet, playWithPet, petSleep, healPet, loading, coins } = useGame();
    const [action, setAction] = useState<'idle' | 'eating' | 'sleeping' | 'playing'>('idle');
    const [adoptionData, setAdoptionData] = useState({ name: '', type: 'cat' as const });
    const [particleType, setParticleType] = useState<'food' | 'heart' | 'coin' | 'sparkle' | null>(null);

    // Reset action to idle after delay
    useEffect(() => {
        if (action !== 'idle' && action !== 'sleeping') {
            const timer = setTimeout(() => setAction('idle'), 2000);
            return () => clearTimeout(timer);
        }
    }, [action]);

    const handleAction = async (act: () => Promise<void>, anim: typeof action, particle?: typeof particleType) => {
        if (pet?.energy === 0 && anim === 'playing') {
            // Can't play if tired
            return;
        }
        setAction(anim);
        if (particle) {
            setParticleType(particle);
            setTimeout(() => setParticleType(null), 100);
        }
        await act();
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mb-4" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    // ----------------------------------------------------
    // ADOPTION VIEW
    // ----------------------------------------------------
    if (!pet) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border-4 border-yellow-400 overflow-hidden relative"
                >
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-black text-gray-800 mb-2">Adopt a Pet!</h2>
                        <p className="text-gray-500">Choose your new best friend.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-6">
                        {['cat'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setAdoptionData({ ...adoptionData, type: t as any })}
                                className={`p-4 rounded-xl border-2 transition-all ${adoptionData.type === t
                                    ? 'border-yellow-400 bg-yellow-50 scale-105 shadow-md'
                                    : 'border-gray-100 hover:border-yellow-200'
                                    }`}
                            >
                                <div className="text-4xl mb-2 text-center">
                                    🐱
                                </div>
                                <div className="text-center font-bold capitalize text-gray-700">Orange Tabby Cat</div>
                            </button>
                        ))}
                    </div>

                    <input
                        type="text"
                        placeholder="Name your pet..."
                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-lg mb-6 focus:outline-none focus:border-yellow-400 text-center"
                        value={adoptionData.name}
                        onChange={(e) => setAdoptionData({ ...adoptionData, name: e.target.value })}
                    />

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => adoptionData.name && adoptPet(adoptionData.name, adoptionData.type)}
                            disabled={!adoptionData.name}
                            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 py-3 rounded-xl font-bold shadow-lg shadow-yellow-200 disabled:opacity-50 disabled:shadow-none"
                        >
                            Adopt Now
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ----------------------------------------------------
    // GAME VIEW
    // ----------------------------------------------------
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden relative border-8 border-white"
            >
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/10 to-transparent">
                    <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
                        <span className="font-black text-gray-800">{pet.name}</span>
                        <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full uppercase">{pet.stage}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white/90 p-2 rounded-full hover:bg-white text-gray-500 font-bold"
                    >
                        ✕
                    </button>
                </div>

                {/* Main Viewport (Room) */}
                <div className="h-[400px] bg-gradient-to-b from-[#87CEEB] to-[#C1E0F7] relative flex items-center justify-center overflow-hidden">
                    {/* Animated Clouds */}
                    <motion.div
                        className="absolute top-8 left-10 text-4xl opacity-80"
                        animate={{ x: [0, 20, 0] }}
                        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                    >
                        ☁️
                    </motion.div>
                    <motion.div
                        className="absolute top-16 right-20 text-5xl opacity-70"
                        animate={{ x: [0, -15, 0] }}
                        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
                    >
                        ☁️
                    </motion.div>

                    {/* Sun */}
                    <motion.div
                        className="absolute top-6 right-6 text-5xl"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    >
                        ☀️
                    </motion.div>

                    {/* Floor with grass */}
                    <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-b from-[#90C695] to-[#7AB87E]">
                        <div className="absolute bottom-0 left-0 right-0 flex justify-around text-2xl pb-2">
                            <span>🌱</span><span>🌼</span><span>🌱</span><span>🌸</span><span>🌱</span><span>🌼</span>
                        </div>
                    </div>

                    {/* Furniture - Food Bowl */}
                    <div className="absolute bottom-24 left-12 text-4xl z-5">
                        🥣
                    </div>

                    {/* Furniture - Toy Ball */}
                    <motion.div
                        className="absolute bottom-28 right-16 text-3xl z-5 cursor-pointer"
                        whileHover={{ scale: 1.2, rotate: 45 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        ⚽
                    </motion.div>

                    {/* Pet */}
                    <div className="relative z-10 pt-20">
                        <PixelCat action={action} />
                    </div>

                    {/* Particle Effects */}
                    {particleType && (
                        <ParticleEffect
                            type={particleType}
                            trigger={true}
                            onComplete={() => setParticleType(null)}
                        />
                    )}

                    {/* Stats Floaters with Enhanced Design */}
                    <div className="absolute top-20 right-6 flex flex-col gap-2">
                        <StatBar icon={<Heart className="w-3 h-3 text-white" />} value={pet.happiness} color="bg-gradient-to-r from-pink-500 to-pink-600" label="Joy" />
                        <StatBar icon={<Utensils className="w-3 h-3 text-white" />} value={pet.hunger} color="bg-gradient-to-r from-orange-500 to-orange-600" label="Food" />
                        <StatBar icon={<Zap className="w-3 h-3 text-white" />} value={pet.energy} color="bg-gradient-to-r from-yellow-500 to-yellow-600" label="Energy" />
                        <StatBar icon={<Pill className="w-3 h-3 text-white" />} value={pet.health} color="bg-gradient-to-r from-green-500 to-green-600" label="Health" />
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-gray-50 p-6">
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <ActionButton
                            icon={<Utensils />}
                            label="Feed"
                            cost={10}
                            onClick={() => handleAction(feedPet, 'eating', 'food')}
                            color="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 hover:from-orange-200 hover:to-orange-300 shadow-md hover:shadow-lg"
                        />
                        <ActionButton
                            icon={<Gamepad2 />}
                            label="Play"
                            onClick={() => handleAction(playWithPet, 'playing', 'heart')}
                            color="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 hover:from-blue-200 hover:to-blue-300 shadow-md hover:shadow-lg"
                        />
                        <ActionButton
                            icon={<Moon />}
                            label="Sleep"
                            onClick={() => setAction(action === 'sleeping' ? 'idle' : 'sleeping')}
                            isActive={action === 'sleeping'}
                            color="bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 hover:from-purple-200 hover:to-purple-300 shadow-md hover:shadow-lg"
                        />
                        <ActionButton
                            icon={<Pill />}
                            label="Heal"
                            cost={50}
                            disabled={pet.health === 100}
                            onClick={() => handleAction(healPet, 'idle', 'sparkle')}
                            color="bg-gradient-to-br from-green-100 to-green-200 text-green-700 hover:from-green-200 hover:to-green-300 shadow-md hover:shadow-lg"
                        />
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold text-gray-400">
                        <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="text-gray-900">{coins} Treats</span>
                        </div>
                        <div>
                            LVL {Math.floor(pet.experience / 100) + 1}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function StatBar({ icon, value, color, label }: { icon: React.ReactNode, value: number, color: string, label?: string }) {
    const isLow = value < 30;

    return (
        <motion.div
            className="w-36 bg-white/60 backdrop-blur-md rounded-full h-6 relative overflow-hidden flex items-center px-2 gap-2 shadow-md border border-white/40"
            animate={isLow ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
        >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${color} shadow-sm`}>
                {icon}
            </div>
            <div className="flex-1 flex flex-col gap-0.5">
                {label && <span className="text-[9px] font-bold text-gray-600 leading-none">{label}</span>}
                <div className="bg-gray-200/60 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        className={`h-full ${color} ${isLow ? 'animate-pulse' : ''}`}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>
            </div>
            <span className="text-[10px] font-bold text-gray-700">{value}</span>
        </motion.div>
    );
}

function ActionButton({ icon, label, onClick, cost, color, isActive, disabled }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${isActive ? 'ring-2 ring-offset-2 ring-purple-400 scale-95' : 'hover:scale-105 active:scale-95'
                } ${color} ${disabled ? 'opacity-50 grayscale' : 'shadow-sm'}`}
        >
            <div className="mb-1">{icon}</div>
            <span className="text-xs font-bold">{label}</span>
            {cost && (
                <span className="text-[10px] mt-1 bg-white/50 px-1.5 rounded-full flex items-center gap-0.5">
                    <Coins className="w-2 h-2" /> {cost}
                </span>
            )}
        </button>
    );
}
