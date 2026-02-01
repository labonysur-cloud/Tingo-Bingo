"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming utils exists, if not I'll use utility class string

export default function LikeButton({
    isLiked,
    likesCount,
    onClick,
    size = "md"
}: {
    isLiked: boolean;
    likesCount: number;
    onClick: () => void;
    size?: "sm" | "md" | "lg";
}) {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isLiked) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 1000); // Reset animation
        }
        onClick();
    };

    const sizeClasses = {
        sm: "w-5 h-5",
        md: "w-6 h-6",
        lg: "w-8 h-8"
    };

    return (
        <button
            onClick={handleClick}
            className="group flex items-center gap-1.5 focus:outline-none transition-all active:scale-90"
        >
            <div className="relative">
                <Heart
                    className={cn(
                        sizeClasses[size],
                        "transition-all duration-300",
                        isLiked ? "fill-red-500 text-red-500 scale-110" : "text-gray-500 group-hover:text-red-500"
                    )}
                />

                {/* Explosion Particles (CSS-only approximation) */}
                {isAnimating && (
                    <>
                        <span className="absolute inset-0 block animate-ping rounded-full bg-red-400 opacity-75 duration-300 pointer-events-none"></span>
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                            {/* Simple CSS sparkles could go here if we had detailed CSS, for now the ping is feedback */}
                        </div>
                    </>
                )}
            </div>

            <span className={cn(
                "font-bold text-sm transition-colors",
                isLiked ? "text-red-600" : "text-gray-500 group-hover:text-red-500"
            )}>
                {likesCount}
            </span>
        </button>
    );
}
