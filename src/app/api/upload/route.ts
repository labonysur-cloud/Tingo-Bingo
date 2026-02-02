import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Server-side Cloudinary config (API secret only accessible server-side)
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET, // Server-side only - NOT exposed to client
});

/**
 * Secure server-side image upload to Cloudinary
 * Replaces client-side upload to protect API secret
 * 
 * POST /api/upload
 * Body: FormData with 'file' field
 * Returns: { url: string, publicId: string }
 */
export async function POST(request: NextRequest) {
    try {
        console.log("📨 Upload request received");

        let file: File | null = null;

        try {
            const formData = await request.formData();
            file = formData.get('file') as File;
        } catch (e) {
            console.error("Error parsing form data:", e);
            return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 });
        }

        if (!file) {
            console.error("No file in form data");
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log(`📁 File received: ${file.name} (${file.type}, ${file.size} bytes)`);

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only images allowed.' }, { status: 400 });
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File too large. Max size is 10MB.' }, { status: 400 });
        }

        // Convert file to buffer for Cloudinary upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log(`📤 Uploading to Cloudinary...`);

        // Upload to Cloudinary using upload_stream (more reliable than data URI)
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'tingobingo/uploads',
                    // Auto-optimization transformations
                    transformation: [
                        { width: 1080, crop: 'limit' }, // Max width 1080px
                        { quality: 'auto:good' }, // Auto quality
                        { fetch_format: 'auto' }, // Auto format (WebP for supported browsers)
                    ],
                    // Additional security
                    invalidate: true, // Invalidate CDN cache
                    resource_type: 'auto', // Auto-detect resource type
                },
                (error, result) => {
                    if (error) {
                        console.error('❌ Cloudinary upload error:', error);
                        reject(error);
                    } else {
                        console.log('✅ Image uploaded successfully:', result?.public_id);
                        resolve(result);
                    }
                }
            );

            // Write buffer to stream
            uploadStream.end(buffer);
        });

        return NextResponse.json({
            url: (result as any).secure_url,
            publicId: (result as any).public_id,
            width: (result as any).width,
            height: (result as any).height,
            format: (result as any).format,
        });
    } catch (error: any) {
        console.error('❌ Upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}

// Optional: Add rate limiting
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 second timeout
