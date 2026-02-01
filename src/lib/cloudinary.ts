/**
 * Cloudinary Upload Helper (Secure Server-Side)
 * 
 * Security Improvement:
 * - Upload via /api/upload route (protects API secret)
 * - Server handles validation and optimization
 * - Cloudinary auto-converts to 1080px + WebP format
 */

/**
 * Upload image to Cloudinary via secure API route
 * @param file - Image file to upload
 * @returns Cloudinary secure URL
 */
export async function uploadToCloudinary(file: File): Promise<string> {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Upload via secure API route
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();
        console.log('✅ Upload successful:', data.publicId);

        return data.url; // Cloudinary optimized URL
    } catch (error: any) {
        console.error('❌ Upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
}

/**
 * Get thumbnail URL from Cloudinary image
 * Uses Cloudinary's on-the-fly transformation (no extra storage)
 */
export function getCloudinaryThumbnail(imageUrl: string, size: number = 400): string {
    if (!imageUrl || !imageUrl.includes("cloudinary.com")) {
        return imageUrl; // Return original if not a Cloudinary URL
    }

    // Insert transformation before /upload/
    return imageUrl.replace(
        "/upload/",
        `/upload/w_${size},h_${size},c_fill,f_auto,q_auto/`
    );
}
