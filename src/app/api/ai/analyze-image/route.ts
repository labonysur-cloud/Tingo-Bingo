import { NextRequest, NextResponse } from 'next/server';
import { hf, AI_MODELS } from '@/lib/huggingface';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        // explicit MIME type is crucial for some HF models
        const blob = new Blob([buffer], { type: file.type });

        let lastError = null;

        // 1. 🏆 TRY CUSTOM MODEL FIRST (Classification)
        try {
            console.log(`Trying Custom Model: ${AI_MODELS.customBreedModel}`);
            const result = await hf.imageClassification({
                data: blob,
                model: AI_MODELS.customBreedModel,
            });

            // Format: "Persian (98%), Siamese (2%)"
            const topPrediction = result[0];
            const description = `I am ${Math.round(topPrediction.score * 100)}% sure this is a ${topPrediction.label}.`;

            return NextResponse.json({
                description: description,
                raw: result,
                modelUsed: AI_MODELS.customBreedModel
            });

        } catch (err: any) {
            console.warn(`Custom Model failed (might be loading):`, err.message);
            lastError = err; // Save for debug
            // Don't error out, just continue to fallbacks
        }

        // 2. FALLBACK to Generic Captioning Models
        for (const model of AI_MODELS.visionModels) {
            try {
                console.log(`Trying Caption Model: ${model}`);
                const result = await hf.imageToText({
                    data: blob,
                    model: model,
                });

                return NextResponse.json({
                    description: result.generated_text,
                    raw: result,
                    modelUsed: model,
                    // Debug info
                    customModelError: lastError ? lastError.message : undefined
                });
            } catch (err: any) {
                console.warn(`Caption Model ${model} failed:`, err.message);
                lastError = err;
            }
        }

        // 3. FINAL FALLBACK: Generic Classification (ResNet)
        try {
            console.log(`Trying Final Fallback: Classification (${AI_MODELS.classification})`);
            const result = await hf.imageClassification({
                data: blob,
                model: AI_MODELS.classification,
            });

            const labels = result.map(r => r.label).join(', ');
            const description = `I see: ${labels}`;

            return NextResponse.json({
                description: description,
                raw: result,
                modelUsed: AI_MODELS.classification,
                debugNote: "Fallback logic triggered",
                customModelError: lastError ? lastError.message : "Unknown error"
            });

        } catch (err: any) {
            console.error("Classification Fallback also failed:", err);
            lastError = err;
        }

        // If EVERYTHING failed
        throw lastError || new Error('All AI models (Custom, Captioning, and Classification) failed.');

    } catch (error: any) {
        console.error('AI Analysis Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to analyze image' },
            { status: 500 }
        );
    }
}
