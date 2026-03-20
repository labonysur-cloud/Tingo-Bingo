import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { text, voice = 'troy' } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        console.log(`Generating speech for text: ${text.substring(0, 50)}...`);

        // Orpheus TTS
        const response = await groq.audio.speech.create({
            model: "canopylabs/orpheus-v1-english",
            voice: voice,
            input: text,
            response_format: "wav"
        });

        const buffer = await response.arrayBuffer();

        // Send back a raw audio stream so the browser can immediately play it
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': buffer.byteLength.toString()
            }
        });

    } catch (error: any) {
        console.error('Groq TTS Error:', error);
        
        // Handle Groq terms of service error for partner models
        if (error.message?.includes('model_terms_required') || error.error?.error?.code === 'model_terms_required') {
             return NextResponse.json(
                { error: 'You need to accept the Orpheus Voice Terms of Use on your Groq Console first! Visit console.groq.com/models' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to generate speech' },
            { status: 500 }
        );
    }
}
