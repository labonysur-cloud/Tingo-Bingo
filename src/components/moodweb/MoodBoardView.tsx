"use client";

import { Plus, LayoutGrid } from "lucide-react";

export default function MoodBoardView() {
    // NOTE: Mock pins removed.
    const pins: any[] = [];

    return (
        <div className="pb-24 min-h-screen bg-gray-50 p-4">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mood Board</h1>
                    <p className="text-sm font-medium text-gray-400">Curated aesthetics</p>
                </div>
                <button className="bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors">
                    <Plus className="w-6 h-6" />
                </button>
            </header>

            {pins.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mb-4 transform rotate-12">
                        <LayoutGrid className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Inspire & Be Inspired</h3>
                    <p className="text-gray-500 max-w-xs mb-8">Create mood boards for your pet's style. Pin your favorite images here.</p>
                    <button className="modern-button px-8">Create First Pin</button>
                </div>
            ) : (
                <div className="columns-2 md:columns-3 gap-4 space-y-4">
                    {/* Masonry would go here */}
                </div>
            )}
        </div>
    );
}
