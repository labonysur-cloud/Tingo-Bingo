"use client";

import { Home, LayoutGrid, Siren, ShoppingBag, User, MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";

export default function BottomNav() {
    const pathname = usePathname();
    const { user, isLoading } = useAuth();

    if (isLoading || !user) return null;

    const navItems = [
        { label: "Home", href: "/", icon: Home },
        { label: "Search", href: "/search", icon: Search },
        { label: "SOS", href: "/sos", icon: Siren, highlight: true },
        { label: "Messages", href: "/messages", icon: MessageCircle },
        { label: "Profile", href: "/profile", icon: User },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 glass-nav h-20 z-50 pb-safe">
            <div className="flex justify-around items-center h-full max-w-lg mx-auto px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    if (item.highlight) {
                        return (
                            <Link key={item.href} href={item.href}>
                                <div className="bg-gradient-to-tr from-red-500 to-pink-600 rounded-full p-4 shadow-lg hover:shadow-red-500/50 hover:scale-105 transition-all -mt-10 border-4 border-white/50 backdrop-blur-sm">
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex flex-col items-center justify-center w-full h-full transition-all duration-300 group rounded-xl hover:bg-white/50",
                                isActive ? "text-primary" : "text-gray-400"
                            )}
                        >
                            <Icon
                                className={clsx(
                                    "w-6 h-6 transition-transform duration-300",
                                    isActive ? "scale-110" : "group-hover:scale-110"
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span
                                className={clsx(
                                    "text-[10px] font-semibold mt-1 transition-all duration-300",
                                    isActive ? "text-primary translate-y-0 opacity-100" : "text-gray-400 translate-y-2 opacity-0 h-0"
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
