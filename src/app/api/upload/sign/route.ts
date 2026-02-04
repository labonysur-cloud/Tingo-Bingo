import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

const videoCloudinary = cloudinary;
videoCloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_API_KEY,
    api_secret: process.env.CLOUDINARY_VIDEO_API_SECRET,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { folder } = body;

        // Verify Authentication if needed (optional but recommended)

        const timestamp = Math.round((new Date).getTime() / 1000);

        // Define exact upload parameters that we want to enforce
        // This ensures the client can't upload unauthorized stuff or bypass compression
        const params = {
            timestamp: timestamp,
            folder: folder || 'tingobingo/reels',
            // COMPRESSION & OPTIMIZATION SETTINGS
            // q_auto: Intelligent compression (saves space, keeps quality)
            // f_auto: Best format for device (likely mp4 or webm)
            transformation: "w_720,c_limit,q_auto,f_auto",
        };

        const signature = videoCloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_VIDEO_API_SECRET!);

        return NextResponse.json({
            signature,
            timestamp,
            cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_CLOUD_NAME,
            apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_API_KEY,
            folder: params.folder,
            transformation: params.transformation
        });

    } catch (error: any) {
        console.error("Signature generation failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
