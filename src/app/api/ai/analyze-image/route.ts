import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        // Convert to base64 for Groq vision model
        const base64Image = Buffer.from(buffer).toString('base64');
        const dataUrl = `data:${file.type};base64,${base64Image}`;

        try {
            console.log(`Analyzing image with Groq Vision Model`);
            
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "What kind of pet is in this image? Describe its breed if possible, and any notable features. Keep the description under 3 sentences." },
                            { type: "image_url", image_url: { url: dataUrl } }
                        ]
                    }
                ],
                model: "llama-3.2-90b-vision-preview",
                temperature: 0.5,
                max_tokens: 150,
            });

            const description = chatCompletion.choices[0]?.message?.content || "I see a cute pet!";

            return NextResponse.json({
                description: description,
                modelUsed: "llama-3.2-90b-vision-preview (Groq)"
            });

        } catch (err: any) {
            console.error("Groq Vision Model failed:", err.message);
            throw err;
        }

    } catch (error: any) {
        console.error('AI Analysis Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to analyze image' },
            { status: 500 }
        );
    }
}
