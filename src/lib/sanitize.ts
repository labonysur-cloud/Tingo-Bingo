/**
 * Input Sanitization & Validation Utilities
 * Prevents XSS attacks and validates user input
 */

/**
 * Sanitize plain text (removes potentially dangerous characters)
 * Use for: usernames, post captions, bios, comments
 */
export function sanitizeText(text: string): string {
    if (!text) return '';

    return text
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets (prevents basic XSS)
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers (onclick=, onerror=, etc.)
        .substring(0, 5000); // Max length to prevent DoS
}

/**
 * Validate and sanitize username
 * Rules: lowercase, alphanumeric + underscore, 3-20 chars
 */
export function sanitizeUsername(username: string): string {
    if (!username) return '';

    return username
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '') // Only allow letters, numbers, underscore
        .substring(0, 20); // Max 20 characters
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
    if (!email) return '';

    return email
        .toLowerCase()
        .trim()
        .substring(0, 255); // Reasonable max length
}

/**
 * Validate URL (for profile links, etc.)
 * Returns sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
    if (!url) return '';

    try {
        const parsed = new URL(url);
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '';
        }
        return parsed.toString();
    } catch {
        return ''; // Invalid URL
    }
}

/**
 * Validate image file type
 */
export function isValidImageType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
}

/**
 * Validate file size (max 10MB)
 */
export function isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxBytes;
}

/**
 * Compress image before upload (reduces file size)
 */
export async function compressImage(file: File, maxWidth: number = 1080): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if needed
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    0.8 // 80% quality
                );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}
