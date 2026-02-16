"use client";

import { motion } from "framer-motion";
import { VirtualPet } from "@/context/GameContext";

interface PetSpriteProps {
    pet: VirtualPet;
    action: 'idle' | 'eating' | 'sleeping' | 'playing';
}

export default function PetSprite({ pet, action }: PetSpriteProps) {

    // Placeholder Emojis/Assets for now until generation works
    const getPetAsset = () => {
        switch (pet.type) {
            case 'cat': return '🐱';
            case 'dog': return '🐶';
            case 'rabbit': return '🐰';
            case 'bird': return '🐦';
            default: return '🐾';
        }
    };

    const variants: any = {
        idle: {
            y: [0, -10, 0],
            transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
        },
        eating: {
            rotate: [0, -10, 10, 0],
            scale: [1, 1.1, 1],
            transition: { repeat: Infinity, duration: 0.5 }
        },
        playing: {
            x: [-20, 20, -20],
            y: [0, -30, 0],
            rotate: [0, 360, 0],
            transition: { repeat: Infinity, duration: 1.5 }
        },
        sleeping: {
            opacity: 0.8,
            scale: 0.9,
            y: 10
        }
    };

    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Shadow */}
            <div className="absolute bottom-2 w-20 h-4 bg-black/20 rounded-full blur-sm" />

            {/* Sprite */}
            <motion.div
                variants={variants}
                animate={action}
                className="text-8xl filter drop-shadow-lg cursor-pointer"
            >
                {getPetAsset()}
            </motion.div>

            {/* Status Indicators */}
            {pet.status === 'sick' && (
                <div className="absolute top-0 right-0 text-4xl animate-pulse">
                    🤒
                </div>
            )}
            {action === 'sleeping' && (
                <div className="absolute -top-10 right-0 text-4xl animate-bounce">
                    💤
                </div>
            )}
        </div>
    );
}
