import { HfInference } from '@huggingface/inference';

// Initialize the client
// We use a non-null assertion or default to empty string, but strictly it requires a token.
// The user must provide HUGGINGFACE_API_KEY in .env.local
export const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export const AI_MODELS = {
    // 🏆 YOUR CUSTOM MODEL (Trained on Colab!)
    customBreedModel: 'Labony/my-cat-detector',

    // Fallbacks
    visionModels: [
        'Salesforce/blip-image-captioning-large',
        'Salesforce/blip-image-captioning-base',
        'nlpconnect/vit-gpt2-image-captioning',
        'microsoft/git-base'
    ],
    chat: 'mistralai/Mistral-7B-Instruct-v0.2',
    classification: 'microsoft/resnet-50'
};
