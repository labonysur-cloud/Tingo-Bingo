"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle } from "lucide-react";

// Dynamically import Map to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/map/MapComponent"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-3xl flex items-center justify-center text-gray-400 font-medium">Loading Map...</div>,
});

export default function SOSView() {
    const [active, setActive] = useState(false);
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [status, setStatus] = useState("Tap for Emergency");

    const handleSOS = () => {
        setActive(true);
        setStatus("Locating...");

        // Simulate finding location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                    setStatus("ALARM SENT! NOTIFYING NEARBY USERS...");
                },
                () => {
                    setStatus("Location Error. Call 911.");
                }
            );
        } else {
            // Fallback mock
            setTimeout(() => {
                setPosition([51.505, -0.09]);
                setStatus("ALARM SENT! (Mock Location)");
            }, 2000);
        }
    };

    return (
        <div className="pb-24 p-6 flex flex-col items-center text-center min-h-[85vh] justify-center bg-red-50/30">

            {!active && (
                <div className="mb-10 animate-in fade-in zoom-in duration-500">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency SOS</h1>
                    <p className="text-gray-500 max-w-xs mx-auto">Pressing the button will alert nearby users and share your location.</p>
                </div>
            )}

            {/* SOS Button */}
            <button
                onClick={handleSOS}
                className={`relative w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all duration-500 ${active
                        ? "bg-red-600 scale-95 shadow-[0_0_0_20px_rgba(220,38,38,0.2)] animate-pulse"
                        : "bg-gradient-to-br from-red-500 to-red-600 shadow-2xl shadow-red-500/40 hover:scale-105 active:scale-95"
                    }`}
            >
                <AlertTriangle className={`w-24 h-24 text-white mb-2 ${active ? 'animate-bounce' : ''}`} />
                <span className="text-white font-bold text-xl tracking-widest">{active ? "SENDING..." : "HELP ME"}</span>
            </button>

            {/* Status & Map */}
            <div className={`mt-10 w-full max-w-md transition-all duration-500 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className={`p-4 rounded-xl mb-4 font-bold text-sm shadow-sm border ${active ? "bg-white text-red-600 border-red-100" : "bg-transparent text-transparent border-transparent"}`}>
                    {status}
                </div>

                {active && (
                    <div className="w-full h-80 rounded-3xl overflow-hidden shadow-soft border border-gray-200 bg-white p-1">
                        <div className="w-full h-full rounded-[1.25rem] overflow-hidden">
                            <MapComponent position={position} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
