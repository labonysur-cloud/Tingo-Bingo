"use client";

import { useState } from "react";
import { ShoppingBag, Search } from "lucide-react";

export default function ShopView() {
    const [cart] = useState<number[]>([]);
    // NOTE: Mock products removed as requested.
    const products: any[] = [];

    return (
        <div className="pb-24 bg-gray-50 min-h-screen">
            <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10 px-4 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pet Shop</h1>
                    <p className="text-xs font-medium text-gray-500">Treats & Toys for furry friends</p>
                </div>
                <div className="relative p-2 bg-gray-100 rounded-full text-gray-600">
                    <ShoppingBag className="w-6 h-6" />
                    {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                            {cart.length}
                        </span>
                    )}
                </div>
            </header>

            {/* Search Bar Placeholder */}
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                    <input type="text" placeholder="Search for treats, toys..." className="modern-input pl-11 bg-white" />
                </div>
            </div>

            {/* Empty State */}
            {products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center opacity-70">
                    <div className="w-40 h-40 bg-gray-200 rounded-full mb-6 flex items-center justify-center">
                        <ShoppingBag className="w-16 h-16 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Shelves are Empty!</h2>
                    <p className="text-gray-500 max-w-xs mx-auto">We are currently stocking up on the best products for your pets. Check back soon!</p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 p-4">
                {/* Product rendering would go here */}
            </div>
        </div>
    );
}
