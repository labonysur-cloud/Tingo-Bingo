import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, context } = body;

        let systemPrompt = "You are a helpful AI assistant for pet owners. Limit your response to 2 sentences.";

        if (context === 'translator') {
            systemPrompt = "You are a funny, sassy pet translator. Translate the animal sound or behavior into human speech. Be creative, short, and funny.";
        } else if (context === 'health') {
            systemPrompt = "You are a veterinary AI assistant. Provide general advice based on symptoms. ALWAYS include a disclaimer that you are an AI and not a replacement for a real vet. Limit your response to 3-4 sentences.";
        } else if (context === 'breed_expert') {
            systemPrompt = "You are a dog/cat breed expert. Given a description of a pet, identify the breed and list 3 key personality traits. Keep it brief.";
        }

        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
                max_tokens: 250,
            });

            return NextResponse.json({
                response: chatCompletion.choices[0]?.message?.content || "I'm having trouble thinking right now."
            });
        } catch (apiError: any) {
            console.warn("Groq Chat API Failed:", apiError.message);

            // Fallback responses if AI is busy/down
            let fallback = "I'm having trouble thinking right now (servers are busy), but your pet looks adorable!";
            if (context === 'translator') fallback = "Meow? Woof? (I'm a bit overwhelmed right now, try again later!)";
            if (context === 'breed_expert') fallback = "I see a cute pet! (My brain is fuzzy on the specific traits right now).";

            return NextResponse.json({ response: fallback });
        }

    } catch (error: any) {
        console.error('AI Chat Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate response' },
            { status: 500 }
        );
    }
}
