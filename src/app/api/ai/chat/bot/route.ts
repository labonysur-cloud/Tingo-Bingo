import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { message, history = [] } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'No message provided' }, { status: 400 });
        }

        console.log(`Processing DM Bot AI request. History length: ${history.length}`);

        // Build messages array
        const systemPrompt = {
            role: 'system',
            content: `You are Zoothophilia AI, a friendly, intelligent, and helpful veterinary and pet-care assistant chatbot. You are designed to chat playfully with users inside their direct messages. You possess deep knowledge of animal behavior, health, and breeds. Always be extremely concise. Keep answers to 1-2 paragraphs max unless explicitly asked for a long response. Do not use emoji excessively.`
        };

        const messages = [
            systemPrompt,
            ...history,
            { role: 'user', content: message }
        ];

        // Using 8b-instant to strictly minimize API compute costs while retaining good chat capabilities
        const chatCompletion = await groq.chat.completions.create({
            messages: messages as any,
            model: "llama-3.1-8b-instant",
            temperature: 0.7,
            max_tokens: 500, // Keep tokens small for cost saving
        });

        const responseText = chatCompletion.choices[0]?.message?.content || "I didn't quite catch that. How can I help your pet today?";

        return NextResponse.json({
            response: responseText,
            modelUsed: "llama-3.1-8b-instant (Groq)"
        });

    } catch (error: any) {
        console.error('Groq Bot Chat Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate response' },
            { status: 500 }
        );
    }
}
