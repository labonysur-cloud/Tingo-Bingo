import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { File } from 'buffer'; // Next.js Polyfill for node buffer

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as globalThis.File;

        if (!file) {
            return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
        }

        console.log(`Transcribing audio, size: ${file.size} bytes`);

        // Convert Blob to File format required by groq sdk (if it's not already)
        // using whisper-large-v3-turbo limits for speed
        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: "whisper-large-v3-turbo",
            response_format: "json",
            language: "en" 
        });

        return NextResponse.json({ text: transcription.text });
        
    } catch (error: any) {
        console.error('Groq STT Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to transcribe audio' },
            { status: 500 }
        );
    }
}
