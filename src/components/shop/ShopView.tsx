"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Search, Filter, Plus, Tag, Heart, ShoppingCart, Package, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import CreateProductModal from "./CreateProductModal";
import EmptyState from "../ui/EmptyState";
import { LoadingSpinner } from "../ui/Loading";

interface Product {
    id: string;
    name: string;
    price: number;
    images: string[];
    category: string;
    seller: {
        id: string;
        name: string;
        avatar: string;
    };
    rating?: number;
    reviews_count?: number;
    stock: number;
    description: string;
    is_active: boolean;
}

export default function ShopView() {
    const { user } = useAuth();
    const [cart, setCart] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"browse" | "myListings">("browse");
    const [products, setProducts] = useState<Product[]>([]);
    const [myProducts, setMyProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const categories = [
        { id: "all", label: "All Products", icon: ShoppingBag },
        { id: "food", label: "Food & Treats", icon: Package },
        { id: "toys", label: "Toys", icon: Heart },
        { id: "furniture", label: "Furniture", icon: Tag },
        { id: "accessories", label: "Accessories", icon: Star }
    ];

    // Fetch all products
    useEffect(() => {
        fetchProducts();
    }, []);

    // Fetch user's products when switching to myListings
    useEffect(() => {
        if (viewMode === "myListings" && user) {
            fetchMyProducts();
        }
    }, [viewMode, user]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    seller:users!seller_id (
                        id,
                        name,
                        avatar
                    )
                `)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Calculate ratings (you'd normally get this from reviews)
            const productsWithRatings = (data || []).map(p => ({
                ...p,
                images: p.images || [],
                rating: 0,
                reviews_count: 0
            }));

            setProducts(productsWithRatings as any);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyProducts = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    seller:users!seller_id (
                        id,
                        name,
                        avatar
                    )
                `)
                .eq('seller_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMyProducts((data || []) as any);
        } catch (error) {
            console.error('Error fetching my products:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === "all" || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const addToCart = (productId: string) => {
        if (!cart.includes(productId)) {
            setCart([...cart, productId]);
        }
    };

    const handleProductCreated = () => {
        setShowCreateModal(false);
        fetchProducts();
        fetchMyProducts();
    };

    return (
        <div className="pb-24 bg-gradient-to-b from-gray-50 to-white min-h-screen">
            {/* Header */}
            <header className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-200 z-20 shadow-sm">
                <div className="px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900">Pet Marketplace</h1>
                        <p className="text-xs font-semibold text-gray-500">Quality products for your pets</p>
                    </div>
                    <div className="relative">
                        <button className="p-3 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all active:scale-95">
                            <ShoppingCart className="w-6 h-6" />
                        </button>
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-black w-6 h-6 flex items-center justify-center rounded-full shadow-md animate-pulse">
                                {cart.length}
                            </span>
                        )}
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="px-4 pb-3 flex gap-2">
                    <button
                        onClick={() => setViewMode("browse")}
                        className={`flex-1 py-2 px-4 rounded-xl font-bold text-sm transition-all ${viewMode === "browse"
                                ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        Browse Products
                    </button>
                    <button
                        onClick={() => setViewMode("myListings")}
                        className={`flex-1 py-2 px-4 rounded-xl font-bold text-sm transition-all ${viewMode === "myListings"
                                ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        My Listings
                    </button>
                </div>
            </header>

            {loading ? (
                <LoadingSpinner size="lg" text="Loading products..." />
            ) : viewMode === "browse" ? (
                <>
                    {/* Search Bar */}
                    <div className="p-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for treats, toys, accessories..."
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none font-medium text-gray-900 placeholder-gray-400"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
                                <Filter className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="px-4 pb-4 overflow-x-auto scrollbar-hide">
                        <div className="flex gap-2 min-w-max">
                            {categories.map((cat) => {
                                const Icon = cat.icon;
                                const isActive = activeCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${isActive
                                                ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg scale-105"
                                                : "bg-white text-gray-600 border-2 border-gray-200 hover:border-orange-300"
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Products Grid */}
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 p-4">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 group border border-gray-100"
                                >
                                    {/* Product Image */}
                                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                                        {product.images[0] ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-16 h-16 text-gray-300" />
                                            </div>
                                        )}
                                        {product.stock < 30 && (
                                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                Low Stock
                                            </div>
                                        )}
                                        <button className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all active:scale-90">
                                            <Heart className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-3">
                                        <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 leading-tight">
                                            {product.name}
                                        </h3>

                                        {/* Seller */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <img src={product.seller.avatar} className="w-5 h-5 rounded-full" alt="" />
                                            <span className="text-xs text-gray-500 font-medium">{product.seller.name}</span>
                                        </div>

                                        {/* Price & Action */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-black text-gray-900">
                                                ${product.price}
                                            </span>
                                            <button
                                                onClick={() => addToCart(product.id)}
                                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${cart.includes(product.id)
                                                        ? "bg-gray-200 text-gray-600"
                                                        : "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md hover:shadow-lg active:scale-95"
                                                    }`}
                                            >
                                                {cart.includes(product.id) ? "In Cart" : "Add"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Package}
                            title="No Products Found"
                            description="No products match your search. Try adjusting your filters or be the first to list something!"
                        />
                    )}
                </>
            ) : (
                // My Listings View
                <div className="p-4">
                    {myProducts.length === 0 ? (
                        <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl p-8 text-white text-center mb-6 shadow-xl">
                            <Plus className="w-16 h-16 mx-auto mb-4" />
                            <h3 className="text-2xl font-black mb-2">Start Selling</h3>
                            <p className="text-white/90 mb-6 max-w-sm mx-auto">
                                List your pet products and reach thousands of pet owners
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-white text-orange-600 px-8 py-3 rounded-2xl font-black hover:shadow-2xl transition-all active:scale-95"
                            >
                                Create New Listing
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-black text-gray-900">Your Listings</h2>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:shadow-lg transition-all active:scale-95"
                                >
                                    Add Product
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {myProducts.map((product) => (
                                    <div key={product.id} className="bg-white rounded-2xl p-3 shadow-md border border-gray-100">
                                        <div className="aspect-square bg-gray-100 rounded-xl mb-2 overflow-hidden">
                                            {product.images[0] ? (
                                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-12 h-12 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-1">{product.name}</h4>
                                        <p className="text-lg font-black text-gray-900">${product.price}</p>
                                        <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Floating Cart Preview */}
            {cart.length > 0 && viewMode === "browse" && (
                <div className="fixed bottom-24 left-4 right-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-4 shadow-2xl flex items-center justify-between z-10 animate-in slide-in-from-bottom">
                    <div className="text-white">
                        <p className="font-black text-lg">{cart.length} items in cart</p>
                        <p className="text-sm text-white/80">Ready to checkout</p>
                    </div>
                    <button className="bg-white text-orange-600 px-6 py-3 rounded-2xl font-black hover:shadow-xl transition-all active:scale-95">
                        View Cart
                    </button>
                </div>
            )}

            {/* Create Product Modal */}
            {showCreateModal && (
                <CreateProductModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleProductCreated}
                />
            )}
        </div>
    );
}
