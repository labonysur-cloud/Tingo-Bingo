import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ✅ Image compression removed - Cloudinary handles optimization server-side
// Cloudinary auto-converts to 1080px + WebP via upload preset
// This saves bandwidth and improves upload speed on mobile devices
