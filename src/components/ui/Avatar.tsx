"use client";

import { Check } from "lucide-react";
import Link from "next/link";

interface AvatarProps {
    src: string;
    alt: string;
    size?: "sm" | "md" | "lg" | "xl";
    userId?: string;
    isOnline?: boolean;
    isVerified?: boolean;
    showBorder?: boolean;
    className?: string;
}

export default function Avatar({
    src,
    alt,
    size = "md",
    userId,
    isOnline,
    isVerified,
    showBorder = false,
    className = ""
}: AvatarProps) {
    const sizes = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
        xl: "w-16 h-16"
    };

    const onlineIndicatorSizes = {
        sm: "w-2 h-2 bottom-0 right-0",
        md: "w-2.5 h-2.5 bottom-0 right-0",
        lg: "w-3 h-3 bottom-0.5 right-0.5",
        xl: "w-4 h-4 bottom-1 right-1"
    };

    const verifiedBadgeSizes = {
        sm: "w-3 h-3 -bottom-0.5 -right-0.5",
        md: "w-4 h-4 -bottom-0.5 -right-0.5",
        lg: "w-5 h-5 -bottom-1 -right-1",
        xl: "w-6 h-6 -bottom-1 -right-1"
    };

    const content = (
        <div className={`relative inline-block ${className}`}>
            <div
                className={`
                    ${sizes[size]}
                    rounded-full
                    overflow-hidden
                    bg-gray-200
                    ${showBorder ? "ring-2 ring-white ring-offset-2" : ""}
                    ${userId ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}
                    shadow-sm
                `}
            >
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Online Status Indicator */}
            {isOnline && (
                <span
                    className={`
                        absolute
                        ${onlineIndicatorSizes[size]}
                        bg-green-500
                        rounded-full
                        border-2
                        border-white
                        shadow-sm
                    `}
                />
            )}

            {/* Verified Badge */}
            {isVerified && (
                <div
                    className={`
                        absolute
                        ${verifiedBadgeSizes[size]}
                        bg-blue-500
                        rounded-full
                        flex
                        items-center
                        justify-center
                        border-2
                        border-white
                        shadow-md
                    `}
                >
                    <Check className="w-full h-full p-0.5 text-white" strokeWidth={3} />
                </div>
            )}
        </div>
    );

    if (userId) {
        return <Link href={`/profile/${userId}`}>{content}</Link>;
    }

    return content;
}
