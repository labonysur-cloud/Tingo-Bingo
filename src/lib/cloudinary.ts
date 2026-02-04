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
            let errorMessage = 'Upload failed';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || 'Upload failed';
            } catch (e) {
                // If response is not JSON (e.g. 413 Payload Too Large HTML from Vercel)
                errorMessage = `Upload failed (${response.status} ${response.statusText})`;
            }
            throw new Error(errorMessage);
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

/**
 * Upload video to Cloudinary via secure API route (Video Account)
 */
/**
 * Upload video directly to Cloudinary (Client-Side)
 * This bypasses the server to prevent timeouts and ECONNRESET on large files.
 */
export async function uploadVideoSigned(file: File): Promise<{ url: string; thumbnail_url: string; duration: number }> {
    try {
        // 1. Get Signature from Server
        const signResponse = await fetch('/api/upload/sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder: 'tingobingo/reels' })
        });

        if (!signResponse.ok) throw new Error("Failed to get upload permission");
        const { signature, timestamp, cloudName, apiKey, folder, transformation } = await signResponse.json();

        // 2. Prepare Direct Upload Form Data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', folder);
        formData.append('transformation', transformation); // Force compression

        // 3. Direct Upload to Cloudinary URL
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Direct upload failed');
        }

        const data = await response.json();

        console.log("✅ Direct Video Upload Success:", data.public_id);

        return {
            url: data.secure_url,
            // Generate a smart thumbnail 
            thumbnail_url: data.secure_url.replace(/\.[^/.]+$/, ".jpg"),
            duration: data.duration
        };

    } catch (error: any) {
        console.error('❌ Direct upload error:', error);
        throw error;
    }
}
