"use client";

import ReelsFeed from '@/components/reels/ReelsFeed';
import ReelUpload from '@/components/reels/ReelUpload';
import { useState, Suspense } from 'react';
import { Plus } from 'lucide-react';

export default function ReelsPage() {
    const [showUpload, setShowUpload] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-4 px-4 overflow-x-hidden">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 sticky top-0 z-50 bg-white/90 backdrop-blur-xl py-4 px-4 rounded-3xl shadow-sm border border-gray-100">
                <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 tracking-tight drop-shadow-sm">
                    Tangii
                </h1>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="group relative p-3 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 hover:scale-110 hover:shadow-pink-500/50 transition-all duration-300"
                >
                    <Plus className={`w-5 h-5 transition-transform duration-300 ${showUpload ? 'rotate-45' : ''}`} strokeWidth={3} />
                </button>
            </header>

            {/* Upload Area */}
            {showUpload && (
                <div className="mb-10 animate-in slide-in-from-top-6 fade-in duration-500 ease-out">
                    <div className="bg-white rounded-3xl p-1 shadow-xl shadow-pink-100/50 border border-pink-100">
                        <ReelUpload onUploadComplete={() => {
                            setShowUpload(false);
                            window.location.reload();
                        }} />
                    </div>
                </div>
            )}

            <Suspense fallback={<div className="text-center p-10">Loading Tangii...</div>}>
                <ReelsFeed />
            </Suspense>
        </div>
    );
}
