"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AboutPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white pb-24">
            <header className="px-4 py-3 flex items-center gap-3 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">About</h1>
            </header>

            <div className="p-6 max-w-lg mx-auto">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl mb-6 transform rotate-3">
                        TB
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">TingoBingo</h1>
                    <p className="text-lg text-gray-500 font-medium">The Super App for Pet Lovers</p>
                </div>

                <div className="space-y-8 text-gray-700 leading-relaxed">
                    <section>
                        <h3 className="font-bold text-xl text-gray-900 mb-2">Our Mission 🐾</h3>
                        <p>
                            TingoBingo is designed to be the ultimate companion for your furry friends.
                            We believe every pet deserves a voice, a community, and the best care possible.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-bold text-xl text-gray-900 mb-2">What We Offer</h3>
                        <ul className="space-y-3 list-disc pl-5 marker:text-primary">
                            <li><strong className="text-gray-900">Social Network:</strong> Connect with other pets, share moments, and find friends.</li>
                            <li><strong className="text-gray-900">Utility Tools:</strong> From SOS alerts to nearby vet maps.</li>
                            <li><strong className="text-gray-900">AI Features:</strong> ZooThopilia helps identify breeds and understand your pet.</li>
                            <li><strong className="text-gray-900">Memory Capsule:</strong> A safe space to honor pets who have crossed the rainbow bridge.</li>
                        </ul>
                    </section>

                    <section className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                        <h3 className="font-bold text-lg text-orange-900 mb-2">100% Free & Open</h3>
                        <p className="text-orange-800 text-sm">
                            This project is built with love and open-source technologies.
                            We leverage the power of the web to bring you a premium experience without the cost.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
