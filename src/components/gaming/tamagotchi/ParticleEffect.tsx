"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
    id: number;
    x: number;
    y: number;
    emoji: string;
    delay: number;
}

interface ParticleEffectProps {
    type: 'food' | 'heart' | 'coin' | 'sparkle' | 'confetti';
    trigger: boolean;
    onComplete?: () => void;
}

export default function ParticleEffect({ type, trigger, onComplete }: ParticleEffectProps) {
    const [particles, setParticles] = useState<Particle[]>([]);

    const getEmoji = () => {
        switch (type) {
            case 'food': return ['🐟', '🥩', '🍖', '🦴'];
            case 'heart': return ['❤️', '💕', '💖', '💗'];
            case 'coin': return ['🪙', '💰', '✨'];
            case 'sparkle': return ['✨', '⭐', '🌟', '💫'];
            case 'confetti': return ['🎉', '🎊', '🎈', '🎁'];
            default: return ['✨'];
        }
    };

    useEffect(() => {
        if (trigger) {
            const emojis = getEmoji();
            const newParticles: Particle[] = Array.from({ length: 8 }, (_, i) => ({
                id: Date.now() + i,
                x: Math.random() * 200 - 100,
                y: Math.random() * 100,
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
                delay: i * 0.1
            }));

            setParticles(newParticles);

            const timer = setTimeout(() => {
                setParticles([]);
                onComplete?.();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [trigger, type]);

    if (particles.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute text-2xl"
                    initial={{
                        x: 0,
                        y: 0,
                        opacity: 0,
                        scale: 0,
                        rotate: 0
                    }}
                    animate={{
                        x: particle.x,
                        y: -particle.y - 50,
                        opacity: [0, 1, 1, 0],
                        scale: [0, 1.2, 1, 0.8],
                        rotate: [0, 180, 360]
                    }}
                    transition={{
                        duration: 1.5,
                        delay: particle.delay,
                        ease: "easeOut"
                    }}
                    style={{
                        left: '50%',
                        top: '50%',
                    }}
                >
                    {particle.emoji}
                </motion.div>
            ))}
        </div>
    );
}
