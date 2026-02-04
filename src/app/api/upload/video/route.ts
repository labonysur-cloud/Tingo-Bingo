import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure a SEPARATE Cloudinary instance for video
const videoCloudinary = cloudinary;
videoCloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_API_KEY,
    api_secret: process.env.CLOUDINARY_VIDEO_API_SECRET,
});

export async function POST(request: NextRequest) {
    try {
        console.log("🎥 Video Upload request received");

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log(`📁 Video received: ${file.name} (${file.type}, ${file.size} bytes)`);

        // 1. Validate File Type (Strictly Video)
        if (!file.type.startsWith('video/')) {
            return NextResponse.json({ error: 'Invalid file type. Only videos allowed.' }, { status: 400 });
        }

        // 2. Validate Size (e.g., 50MB max)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File too large. Max size is 50MB.' }, { status: 400 });
        }

        // 3. Convert to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 4. Upload to Cloudinary (Video Account)
        const result: any = await new Promise((resolve, reject) => {
            const uploadStream = videoCloudinary.uploader.upload_stream(
                {
                    resource_type: 'video',
                    folder: 'tingobingo/reels',
                    // Transformation: Limit to 2 minutes (just in case), resize for mobile
                    transformation: [
                        { duration: "120" }, // Truncate to 2 mins if longer (or error?) - better to truncate or valid client side
                        { width: 720, crop: "limit" }, // 720p is good for mobile reels
                        { quality: "auto" },
                        { fetch_format: "auto" }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        });

        console.log('✅ Video uploaded successfully:', result.public_id);

        return NextResponse.json({
            url: result.secure_url,
            thumbnail_url: result.secure_url.replace(/\.[^/.]+$/, ".jpg"), // Naive thumbnail generation, Cloudinary is smarter but this works for basic
            publicId: result.public_id,
            duration: result.duration,
        });

    } catch (error: any) {
        console.error('❌ Video upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}
