"use client";

import { motion, Variants } from "framer-motion";
import { useState, useEffect } from "react";

interface PixelCatProps {
    action: 'idle' | 'eating' | 'sleeping' | 'playing';
    color?: string;
}

export default function PixelCat({ action, color = "#FFA500" }: PixelCatProps) {
    const [isBlinking, setIsBlinking] = useState(false);

    // Blinking effect for idle state
    useEffect(() => {
        if (action === 'idle') {
            const blinkInterval = setInterval(() => {
                setIsBlinking(true);
                setTimeout(() => setIsBlinking(false), 200);
            }, 3000);
            return () => clearInterval(blinkInterval);
        }
    }, [action]);

    const variants: Variants = {
        idle: {
            y: [0, -4, 0],
            transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
        },
        eating: {
            rotate: [0, -4, 4, 0],
            y: [0, 3, 0],
            transition: { repeat: Infinity, duration: 0.7 }
        },
        playing: {
            y: [0, -20, 0],
            rotate: [0, 15, -15, 0],
            scale: [1, 1.2, 1],
            transition: { repeat: Infinity, duration: 1.2 }
        },
        sleeping: {
            opacity: 0.9,
            scaleY: [1, 0.96, 1],
            transition: { repeat: Infinity, duration: 3.5, ease: "easeInOut" }
        }
    };

    return (
        <div className="relative w-52 h-52 flex items-center justify-center">
            {/* Enhanced Shadow */}
            <motion.div
                className="absolute bottom-6 w-28 h-8 bg-black/25 rounded-full blur-lg"
                animate={{
                    scale: action === 'playing' ? [1, 1.3, 1] : 1,
                    opacity: action === 'sleeping' ? 0.15 : 0.25
                }}
                transition={{ repeat: Infinity, duration: 1.2 }}
            />

            <motion.div
                variants={variants}
                animate={action}
                className="relative"
            >
                <svg
                    width="180"
                    height="180"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="pixel-art-svg drop-shadow-2xl"
                    style={{ imageRendering: "pixelated" }}
                >
                    {/* Beautiful Enhanced Pixel Cat - 48x48 grid */}

                    {/* Animated Tail with gradient */}
                    <motion.g
                        animate={action === 'idle' || action === 'playing' ? {
                            rotate: [0, 8, -8, 0],
                            x: [0, 2, -2, 0]
                        } : {}}
                        transition={{ repeat: Infinity, duration: 1.8 }}
                        style={{ transformOrigin: "34px 28px" }}
                    >
                        {/* Tail base */}
                        <path d="M34 28H36V26H38V24H40V20H42V16H44V12H42V10H40V12H38V14H36V18H34V24H32V28H34Z" fill="#CC8400" />
                        {/* Tail highlight */}
                        <path d="M36 26H38V24H40V20H42V16H44V12H42V14H40V18H38V24H36V26Z" fill="#FFB84D" />
                        {/* Tail tip */}
                        <ellipse cx="43" cy="12" rx="1.5" ry="1.5" fill="#FFF3E0" />
                    </motion.g>

                    {/* Body with rounded shape */}
                    <ellipse cx="22" cy="28" rx="12" ry="10" fill={color} />
                    <rect x="10" y="20" width="24" height="14" fill={color} rx="3" />

                    {/* Body stripes - more visible */}
                    <rect x="12" y="22" width="2.5" height="10" fill="#CC8400" opacity="0.7" rx="1" />
                    <rect x="17" y="22" width="2.5" height="10" fill="#CC8400" opacity="0.7" rx="1" />
                    <rect x="27" y="22" width="2.5" height="10" fill="#CC8400" opacity="0.7" rx="1" />

                    {/* Legs with better shape */}
                    <rect x="12" y="34" width="4" height="6" fill={color} rx="1.5" />
                    <rect x="18" y="34" width="4" height="6" fill={color} rx="1.5" />
                    <rect x="24" y="34" width="4" height="6" fill={color} rx="1.5" />
                    <rect x="30" y="34" width="4" height="6" fill={color} rx="1.5" />

                    {/* Paws with toe beans */}
                    <ellipse cx="14" cy="40" rx="2.5" ry="2" fill="#FFE0B2" />
                    <ellipse cx="20" cy="40" rx="2.5" ry="2" fill="#FFE0B2" />
                    <ellipse cx="26" cy="40" rx="2.5" ry="2" fill="#FFE0B2" />
                    <ellipse cx="32" cy="40" rx="2.5" ry="2" fill="#FFE0B2" />
                    {/* Toe beans detail */}
                    <circle cx="13.5" cy="39.5" r="0.5" fill="#FFB6C1" opacity="0.6" />
                    <circle cx="14.5" cy="39.5" r="0.5" fill="#FFB6C1" opacity="0.6" />
                    <circle cx="19.5" cy="39.5" r="0.5" fill="#FFB6C1" opacity="0.6" />
                    <circle cx="20.5" cy="39.5" r="0.5" fill="#FFB6C1" opacity="0.6" />
                    <circle cx="25.5" cy="39.5" r="0.5" fill="#FFB6C1" opacity="0.6" />
                    <circle cx="26.5" cy="39.5" r="0.5" fill="#FFB6C1" opacity="0.6" />
                    <circle cx="31.5" cy="39.5" r="0.5" fill="#FFB6C1" opacity="0.6" />
                    <circle cx="32.5" cy="39.5" r="0.5" fill="#FFB6C1" opacity="0.6" />

                    {/* Head - rounder and cuter */}
                    <ellipse cx="22" cy="14" rx="11" ry="10" fill={color} />
                    <rect x="11" y="10" width="22" height="12" fill={color} />

                    {/* Ears - more prominent and cute */}
                    <path d="M12 10L9 5L14 7Z" fill={color} />
                    <path d="M32 10L35 5L30 7Z" fill={color} />
                    {/* Inner ear */}
                    <path d="M12 8L10 6L13 7Z" fill="#FFB6C1" />
                    <path d="M32 8L34 6L31 7Z" fill="#FFB6C1" />

                    {/* Head stripes - more defined */}
                    <rect x="14" y="7" width="2.5" height="5" fill="#CC8400" opacity="0.8" rx="1" />
                    <rect x="27" y="7" width="2.5" height="5" fill="#CC8400" opacity="0.8" rx="1" />
                    <ellipse cx="22" cy="8" rx="4" ry="2" fill="#CC8400" opacity="0.6" />

                    {/* Face Details */}
                    {/* Eyes - bigger and more expressive */}
                    {action === 'sleeping' ? (
                        <>
                            <path d="M14 13H18" stroke="black" strokeWidth="2" strokeLinecap="round" />
                            <path d="M26 13H30" stroke="black" strokeWidth="2" strokeLinecap="round" />
                        </>
                    ) : (
                        <>
                            {/* Eye whites */}
                            <ellipse cx="16" cy="13" rx="3" ry={isBlinking ? 0.5 : 3.5} fill="white" />
                            <ellipse cx="28" cy="13" rx="3" ry={isBlinking ? 0.5 : 3.5} fill="white" />
                            {/* Pupils */}
                            <ellipse cx="16" cy="13.5" rx="2" ry={isBlinking ? 0.5 : 2.5} fill="black" />
                            <ellipse cx="28" cy="13.5" rx="2" ry={isBlinking ? 0.5 : 2.5} fill="black" />
                            {/* Eye shine */}
                            {!isBlinking && (
                                <>
                                    <ellipse cx="16.8" cy="12.5" rx="1" ry="1.3" fill="white" opacity="0.9" />
                                    <ellipse cx="28.8" cy="12.5" rx="1" ry="1.3" fill="white" opacity="0.9" />
                                    <circle cx="15.5" cy="14" r="0.5" fill="white" opacity="0.6" />
                                    <circle cx="27.5" cy="14" r="0.5" fill="white" opacity="0.6" />
                                </>
                            )}
                        </>
                    )}

                    {/* Nose - cuter triangle */}
                    <path d="M22 16L20.5 17.5H23.5L22 16Z" fill="#FF69B4" />
                    <ellipse cx="22" cy="17" rx="1.5" ry="1" fill="#FF1493" opacity="0.3" />

                    {/* Mouth - more expressive */}
                    {action === 'eating' ? (
                        <ellipse cx="22" cy="19" rx="3" ry="2.5" fill="#8B4513" />
                    ) : (
                        <>
                            <path d="M22 17.5Q19 19 17 18" stroke="#CC8400" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                            <path d="M22 17.5Q25 19 27 18" stroke="#CC8400" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                        </>
                    )}

                    {/* Whiskers - longer and more elegant */}
                    <line x1="9" y1="14" x2="4" y2="13" stroke="#666" strokeWidth="0.8" opacity="0.8" />
                    <line x1="9" y1="15.5" x2="4" y2="15.5" stroke="#666" strokeWidth="0.8" opacity="0.8" />
                    <line x1="9" y1="17" x2="4" y2="18" stroke="#666" strokeWidth="0.8" opacity="0.8" />
                    <line x1="35" y1="14" x2="40" y2="13" stroke="#666" strokeWidth="0.8" opacity="0.8" />
                    <line x1="35" y1="15.5" x2="40" y2="15.5" stroke="#666" strokeWidth="0.8" opacity="0.8" />
                    <line x1="35" y1="17" x2="40" y2="18" stroke="#666" strokeWidth="0.8" opacity="0.8" />

                    {/* Cheeks - more prominent */}
                    <ellipse cx="11" cy="15" rx="2.5" ry="2" fill="#FFB6C1" opacity="0.5" />
                    <ellipse cx="33" cy="15" rx="2.5" ry="2" fill="#FFB6C1" opacity="0.5" />

                    {/* Chest Fluff - more visible */}
                    <ellipse cx="22" cy="24" rx="5" ry="3" fill="#FFF3E0" opacity="0.7" />
                    <ellipse cx="22" cy="25" rx="3.5" ry="2" fill="#FFFFFF" opacity="0.5" />
                </svg>
            </motion.div>

            {/* Enhanced Zzz Animation for Sleeping */}
            {action === 'sleeping' && (
                <>
                    <motion.div
                        className="absolute -top-2 right-14 font-bold text-indigo-500 text-2xl"
                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                        animate={{ opacity: [0, 1, 0.8, 0], y: -20, scale: 1.2 }}
                        transition={{ repeat: Infinity, duration: 2.5, delay: 0 }}
                    >
                        Z
                    </motion.div>
                    <motion.div
                        className="absolute -top-6 right-10 font-bold text-indigo-400 text-3xl"
                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                        animate={{ opacity: [0, 1, 0.8, 0], y: -25, scale: 1.4 }}
                        transition={{ repeat: Infinity, duration: 2.5, delay: 0.6 }}
                    >
                        Z
                    </motion.div>
                    <motion.div
                        className="absolute -top-10 right-6 font-bold text-indigo-300 text-4xl"
                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                        animate={{ opacity: [0, 1, 0.8, 0], y: -30, scale: 1.6 }}
                        transition={{ repeat: Infinity, duration: 2.5, delay: 1.2 }}
                    >
                        Z
                    </motion.div>
                </>
            )}

            {/* Enhanced Heart Animation for Playing */}
            {action === 'playing' && (
                <>
                    <motion.div
                        className="absolute top-2 right-10 text-pink-500 text-4xl filter drop-shadow-lg"
                        initial={{ opacity: 0, scale: 0, rotate: -30 }}
                        animate={{ opacity: [0, 1, 0.8, 0], scale: [0, 1.4, 1.2, 0], y: -25, rotate: 30 }}
                        transition={{ repeat: Infinity, duration: 1.8, delay: 0 }}
                    >
                        ❤️
                    </motion.div>
                    <motion.div
                        className="absolute top-6 right-6 text-pink-400 text-3xl filter drop-shadow-lg"
                        initial={{ opacity: 0, scale: 0, rotate: 30 }}
                        animate={{ opacity: [0, 1, 0.8, 0], scale: [0, 1.3, 1.1, 0], y: -20, rotate: -30 }}
                        transition={{ repeat: Infinity, duration: 1.8, delay: 0.6 }}
                    >
                        💕
                    </motion.div>
                    <motion.div
                        className="absolute top-4 right-14 text-pink-300 text-2xl filter drop-shadow-lg"
                        initial={{ opacity: 0, scale: 0, rotate: -20 }}
                        animate={{ opacity: [0, 1, 0.8, 0], scale: [0, 1.2, 1, 0], y: -15, rotate: 20 }}
                        transition={{ repeat: Infinity, duration: 1.8, delay: 1.2 }}
                    >
                        💖
                    </motion.div>
                </>
            )}

            {/* Enhanced Food Animation for Eating */}
            {action === 'eating' && (
                <>
                    <motion.div
                        className="absolute top-10 left-14 text-3xl filter drop-shadow-md"
                        animate={{ y: [0, -8, 0], rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 0.7 }}
                    >
                        🐟
                    </motion.div>
                    <motion.div
                        className="absolute top-14 left-10 text-xl opacity-70"
                        animate={{ y: [0, -5, 0], rotate: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 0.7, delay: 0.2 }}
                    >
                        ✨
                    </motion.div>
                </>
            )}
        </div>
    );
}
