"use client";

import { X, Sparkles, LayoutGrid, Gamepad2, ShoppingBag, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
    const [isVisible, setIsVisible] = useState(false);

    // Handle animation timing
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`
                relative w-[80%] max-w-sm h-full bg-white shadow-2xl flex flex-col
                transform transition-transform duration-300 ease-out
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">

                    {/* Primary Features */}
                    <div className="space-y-2 mb-6">
                        <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Features</p>

                        <MenuItem
                            href="/ai"
                            icon={Sparkles}
                            label="Zoothophilia AI"
                            color="text-purple-600"
                            bgColor="bg-purple-50"
                        />
                        <MenuItem
                            href="/moodboard"
                            icon={LayoutGrid}
                            label="Mood Board"
                            color="text-pink-600"
                            bgColor="bg-pink-50"
                        />
                        <MenuItem
                            href="/gaming"
                            icon={Gamepad2}
                            label="Pet Arcade"
                            color="text-orange-500"
                            bgColor="bg-orange-50"
                        />
                    </div>

                    {/* Shopping */}
                    <div className="space-y-2 mb-6">
                        <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Shop</p>
                        <MenuItem
                            href="/shop"
                            icon={ShoppingBag}
                            label="Pet Shop"
                            color="text-blue-600"
                            bgColor="bg-blue-50"
                        />
                    </div>

                    {/* Emergency Section - highlighted */}
                    <div className="mt-auto">
                        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                            <Link href="/emergency" className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-200 group-hover:scale-105 transition-transform">
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-red-700">Emergency</h3>
                                    <p className="text-xs text-red-600/80">Immediate Vet Help</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-red-400" />
                            </Link>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100">
                    <p className="text-center text-xs text-gray-400">
                        TingoBingo v1.0
                    </p>
                </div>
            </div>
        </div>
    );
}

function MenuItem({ href, icon: Icon, label, color, bgColor }: any) {
    return (
        <Link href={href} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
            <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-700 flex-1">{label}</span>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
        </Link>
    )
}
