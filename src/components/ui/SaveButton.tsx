"use client";

import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SaveButton({
    isSaved,
    onClick,
    size = "md"
}: {
    isSaved: boolean;
    onClick: () => void;
    size?: "sm" | "md" | "lg";
}) {
    const sizeClasses = {
        sm: "w-5 h-5",
        md: "w-6 h-6",
        lg: "w-8 h-8"
    };

    return (
        <button
            onClick={onClick}
            className="group flex items-center gap-1.5 focus:outline-none transition-all active:scale-90"
            title={isSaved ? "Unsave from Moodboard" : "Save to Moodboard"}
        >
            <Bookmark
                className={cn(
                    sizeClasses[size],
                    "transition-all duration-300",
                    isSaved
                        ? "fill-blue-500 text-blue-500"
                        : "text-gray-500 group-hover:text-blue-500"
                )}
            />
        </button>
    );
}
