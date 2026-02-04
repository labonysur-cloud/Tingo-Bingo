"use client";

import { Home, User, MessageCircle, Film } from "lucide-react";
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
        { label: "Tangii", href: "/reels", icon: Film },
        { label: "Chat", href: "/chat", icon: MessageCircle },
        { label: "Profile", href: "/profile", icon: User },
    ];


    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-gray-50/80 backdrop-blur-xl border-t border-gray-200 h-20 z-50 pb-safe shadow-2xl">
            <div className="flex justify-around items-center h-full max-w-lg mx-auto px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;


                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex flex-col items-center justify-center w-full h-full transition-all duration-300 group rounded-2xl",
                                isActive ? "text-primary" : "text-gray-400"
                            )}
                        >
                            <div className={clsx(
                                "p-2 rounded-xl transition-all",
                                isActive ? "bg-orange-100 scale-110" : "group-hover:bg-gray-100"
                            )}>
                                <Icon
                                    className={clsx(
                                        "w-6 h-6 transition-transform duration-300",
                                        isActive && "scale-110"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </div>
                            <span
                                className={clsx(
                                    "text-[10px] font-bold mt-1 transition-all duration-300",
                                    isActive ? "text-primary opacity-100" : "text-gray-400 opacity-70"
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
