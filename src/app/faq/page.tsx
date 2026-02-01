"use client";

import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const faqs = [
    {
        question: "Is TingoBingo really free?",
        answer: "Yes! TingoBingo is currently 100% free to use. We use open-source maps and technologies to keep costs at zero for our users."
    },
    {
        question: "How do I create a post?",
        answer: "Go to the Home Feed (first tab) and use the text box at the top to share what's on your mind. You can also upload photos!"
    },
    {
        question: "What is the SOS button for?",
        answer: "The SOS button in the 'Safety' tab effectively alerts nearby users (simulated) and shows your location on a map to help find missing pets."
    },
    {
        question: "How does the AI work?",
        answer: "Our 'Zoothopilia' AI uses advanced algorithms (simulated for prototype) to identify breeds from photos and translate your pet's sounds."
    },
    {
        question: "Can I sell products here?",
        answer: "We are working on a Vendor portal! Currently, the Shop is a curated selection of existing products."
    }
];

export default function FAQPage() {
    const router = useRouter();
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="px-4 py-3 flex items-center gap-3 bg-white border-b border-gray-100 sticky top-0 z-10">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">FAQ</h1>
            </header>

            <div className="p-4 max-w-lg mx-auto space-y-3">
                {faqs.map((faq, index) => (
                    <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="font-bold text-gray-800 pr-4">{faq.question}</span>
                            {openIndex === index ? <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                        </button>
                        {openIndex === index && (
                            <div className="px-4 pb-4 pt-0 text-gray-600 animate-in slide-in-from-top-1">
                                <p className="leading-relaxed border-t border-gray-50 pt-3">{faq.answer}</p>
                            </div>
                        )}
                    </div>
                ))}

                <div className="mt-8 text-center bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <h3 className="font-bold text-blue-900 mb-1">Still have questions?</h3>
                    <p className="text-blue-700 text-sm mb-4">We are here to help you and your pet.</p>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-blue-700 transition-colors">
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    );
}
