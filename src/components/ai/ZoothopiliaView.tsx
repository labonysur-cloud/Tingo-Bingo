"use client";

import { useState, useRef } from "react";
import { Camera, Bot, Mic, Upload, Activity } from "lucide-react";
import ReactMarkdown from 'react-markdown';

export default function ZoothopiliaView() {
    const [activeTab, setActiveTab] = useState<"breed" | "health" | "translator">("breed");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [healthQuery, setHealthQuery] = useState("");

    // --- API HANDLERS ---

    // 1. Breed Identification (Vision)
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        setIsAnalyzing(true);
        setResult(null);

        try {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('image', file);

            // Step 1: Get Description from Vision Model
            const visionRes = await fetch('/api/ai/analyze-image', {
                method: 'POST',
                body: formData
            });
            const visionData = await visionRes.json();

            if (!visionRes.ok) throw new Error(visionData.error);

            // Step 2: Get Traits from Chat Model (Optional - don't fail if this fails)
            try {
                const chatRes = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: `Based on this visual description: "${visionData.description}", identify the likely pet breed and list 3 personality traits. Format nicely.`,
                        context: 'breed_expert'
                    })
                });
                const chatData = await chatRes.json();
                if (!chatRes.ok) throw new Error(chatData.error || 'Chat API failed');

                setResult(chatData.response); // Show full rich response
            } catch (chatErr) {
                console.warn("Chat trait generation failed, showing raw vision result instead:", chatErr);
                // Fallback: Just show what the vision model saw
                setResult(`I see: ${visionData.description}\n\n(Note: Detailed personality traits could not be loaded at this moment).`);
                // Optional: You could allow the UI to show which model was used
                console.log("Model Used:", visionData.modelUsed);
                if (visionData.customModelError) {
                    console.warn("Custom Model Failed Reason:", visionData.customModelError);
                    // Append this to the result so user sees it
                    if (visionData.customModelError.includes("No Inference Provider")) {
                        setResult(prev => prev + `\n\n(Note: Your custom model is currently sleeping/inactive on Hugging Face. Using generic backup.)`);
                    } else {
                        setResult(prev => prev + `\n\n(Note: Custom model error: ${visionData.customModelError})`);
                    }
                }
            }

        } catch (error: any) {
            console.error("AI Error:", error);
            alert("AI Analysis Failed: " + error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // 2. Health Advice (Chat)
    const handleHealthCheck = async () => {
        if (!healthQuery.trim()) return;

        setIsAnalyzing(true);
        setResult(null);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: healthQuery,
                    context: 'health'
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setResult(data.response);
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // 3. Translator (Real STT + AI + TTS)
    const toggleRecording = async () => {
        if (isRecording) {
            // Stop recording
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }

        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop()); // cleanup
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await processAudio(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setResult(null);
        } catch (err) {
            console.error(err);
            alert("Microphone access denied or error occurred.");
        }
    };

    const processAudio = async (audioBlob: Blob) => {
        setIsAnalyzing(true);
        try {
            // 1. Transcribe audio using STT (Whisper)
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            
            const transcribeRes = await fetch('/api/ai/transcribe', {
                method: 'POST',
                body: formData
            });
            const transcribeData = await transcribeRes.json();
            if (!transcribeRes.ok) throw new Error(transcribeData.error || 'Failed to transcribe');
            
            const userText = transcribeData.text;

            if (!userText || userText.trim().length === 0) {
                alert("Couldn't hear anything, please try again!");
                setIsAnalyzing(false);
                return;
            }

            // 2. Generate pet translation using LLM (Llama)
            const chatRes = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `The user/pet said: "${userText}". Translate this playfully into pet speech or interpret the pet sound.`,
                    context: 'translator'
                })
            });
            const chatData = await chatRes.json();
            if (!chatRes.ok) throw new Error(chatData.error || 'Failed to generate response');
            
            const aiResponse = chatData.response;
            setResult(`🎤 Heard: "${userText}"\n\n${aiResponse}`);

            // 3. Speak the translation using TTS (Orpheus)
            const ttsRes = await fetch('/api/ai/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: aiResponse })
            });
            if (!ttsRes.ok) throw new Error('Failed to generate audio');
            
            const audioBlobRet = await ttsRes.blob();
            const audioUrl = URL.createObjectURL(audioBlobRet);
            const audio = new Audio(audioUrl);
            audio.play();

        } catch (error: any) {
             console.error(error);
             alert("Error processing audio: " + error.message);
        } finally {
             setIsAnalyzing(false);
        }
    };

    return (
        <div className="pb-24 p-4 min-h-screen bg-gray-50">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-6 px-2">Zoothopilia AI</h1>

            {/* Modern Tabs */}
            <div className="flex p-1 bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 mx-auto max-w-md">
                {[
                    { id: "breed", icon: Camera, label: "Breed" },
                    { id: "health", icon: Activity, label: "Health" },
                    { id: "translator", icon: Mic, label: "Talk" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as any); setResult(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === tab.id ? "bg-black text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-3xl shadow-soft border border-gray-100 min-h-[400px] flex flex-col items-center justify-center text-center p-8 relative overflow-hidden max-w-md mx-auto">

                {isAnalyzing && (
                    <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 animate-bounce">
                            <Bot className="w-8 h-8 text-secondary" />
                        </div>
                        <p className="font-bold text-gray-800 animate-pulse">Analyzing...</p>
                    </div>
                )}

                {/* Breed ID Content */}
                {activeTab === "breed" && !result && (
                    <div className="w-full animate-in fade-in zoom-in duration-300">
                        <div
                            className="w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center mb-6 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-10 h-10 text-gray-300 mb-2" />
                            <span className="text-gray-400 font-medium text-sm">Tap to Upload Photo</span>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        <p className="text-xs text-gray-400 text-center mt-2">Powered by AI</p>
                    </div>
                )}

                {/* Health Content */}
                {activeTab === "health" && !result && (
                    <div className="w-full animate-in fade-in zoom-in duration-300">
                        <p className="mb-4 text-gray-500 font-medium text-sm">Describe symptoms for AI suggestions.</p>
                        <textarea
                            className="modern-input h-32 mb-6 resize-none bg-gray-50 border-gray-100"
                            placeholder="e.g. My cat is sneezing..."
                            value={healthQuery}
                            onChange={(e) => setHealthQuery(e.target.value)}
                        />
                        <button
                            onClick={handleHealthCheck}
                            className="modern-button w-full shadow-orange-200"
                            disabled={!healthQuery.trim()}
                        >
                            Check Symptoms
                        </button>
                    </div>
                )}

                {/* Translator Content */}
                {activeTab === "translator" && !result && (
                    <div className="w-full animate-in fade-in zoom-in duration-300">
                        <div
                            onClick={toggleRecording}
                            className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 cursor-pointer transition-colors active:scale-95 ring-4 
                                ${isRecording ? 'bg-red-500 ring-red-200 animate-pulse' : 'bg-red-50 hover:bg-red-100 ring-red-50'}`}
                        >
                            <Mic className={`w-12 h-12 ${isRecording ? 'text-white' : 'text-red-500'}`} />
                        </div>
                        <p className="font-bold text-gray-800">
                            {isRecording ? "Listening... Tap to Stop" : "Tap to Speak"}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Speak to your pet, or let your pet speak!</p>
                    </div>
                )}

                {/* Result Area */}
                {result && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500 w-full">
                        <div className="mb-6 -mt-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Bot className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Analysis Complete</h3>
                        </div>

                        <div className="bg-gray-50 p-5 rounded-2xl text-left font-medium text-gray-700 text-sm leading-relaxed mb-6 border border-gray-100 [&>p]:mb-3 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-3 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:mb-3 [&>strong]:text-gray-900">
                            <ReactMarkdown>{result}</ReactMarkdown>
                        </div>

                        <button onClick={() => setResult(null)} className="text-primary font-bold text-sm hover:underline">Start Over</button>
                    </div>
                )}

            </div>
        </div>
    );
}
