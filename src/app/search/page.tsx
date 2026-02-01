"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Search, Loader2, User as UserIcon, AtSign, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResult {
    id: string;
    username: string | null;
    name: string;
    avatar: string | null;
    bio: string | null;
}

export default function SearchPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (searchQuery: string) => {
        setQuery(searchQuery);

        if (!searchQuery.trim()) {
            setResults([]);
            setSearched(false);
            return;
        }

        setLoading(true);
        setSearched(true);

        try {
            // Remove @ if user typed it
            const cleanQuery = searchQuery.replace('@', '').toLowerCase();

            // Search by username OR name (case-insensitive)
            const { data, error } = await supabase
                .from('users')
                .select('id, username, name, avatar, bio')
                .or(`username.ilike.%${cleanQuery}%,name.ilike.%${cleanQuery}%`)
                .limit(20);

            if (error) throw error;

            setResults(data || []);
        } catch (error) {
            console.error("Search error:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setQuery("");
        setResults([]);
        setSearched(false);
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white sticky top-0 z-10 px-4 py-3 shadow-sm">
                <h1 className="text-xl font-bold text-gray-900 text-center">Find Friends</h1>
            </header>

            <main className="max-w-2xl mx-auto p-4">
                {/* Search Input */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
                            placeholder="Search by name or @username"
                        />
                        {query && (
                            <button
                                onClick={handleClear}
                                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 ml-1">
                        Try searching for @username or a person's name
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
                        <p className="text-gray-500">Searching...</p>
                    </div>
                )}

                {/* Results */}
                {!loading && searched && (
                    <div className="space-y-3">
                        {results.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <Search className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">No Results Found</h3>
                                <p className="text-gray-500 text-sm">
                                    Try searching with a different name or username
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-2 px-2">
                                    <h2 className="text-sm font-bold text-gray-700">
                                        {results.length} {results.length === 1 ? 'result' : 'results'} found
                                    </h2>
                                </div>
                                {results.map((result) => (
                                    <Link
                                        key={result.id}
                                        href={`/user/${result.id}`}
                                        className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-purple-500 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 overflow-hidden flex-shrink-0">
                                                <img
                                                    src={result.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.id}`}
                                                    alt={result.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* User Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 text-lg truncate">
                                                    {result.name}
                                                </h3>
                                                {result.username && (
                                                    <div className="flex items-center gap-1 text-purple-600 text-sm font-medium">
                                                        <AtSign className="w-3 h-3" />
                                                        <span>{result.username}</span>
                                                    </div>
                                                )}
                                                {result.bio && (
                                                    <p className="text-gray-500 text-sm truncate mt-1">
                                                        {result.bio}
                                                    </p>
                                                )}
                                            </div>

                                            {/* View Profile Icon */}
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                    <UserIcon className="w-4 h-4 text-purple-600" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* Initial State (No search yet) */}
                {!loading && !searched && (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <Search className="w-10 h-10 text-purple-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">Discover Pet Lovers</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Search by name or username to connect with other pet parents
                        </p>
                        <div className="space-y-2 text-left max-w-xs mx-auto">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                <span>Try: <span className="font-medium">John</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                <span>Try: <span className="font-medium">@petlover123</span></span>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
