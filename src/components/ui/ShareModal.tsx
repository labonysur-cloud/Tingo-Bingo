"use client";

import { useState, useEffect } from "react";
import { X, Copy, Search, Send, Check, Link as LinkIcon, Smartphone } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import toast from "react-hot-toast";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    title?: string;
}

export default function ShareModal({ isOpen, onClose, url, title = "Check out this Tangii!" }: ShareModalProps) {
    const { conversations, sendMessage, isLoading, startConversation } = useChat();
    const [searchQuery, setSearchQuery] = useState("");
    const [sendingTo, setSendingTo] = useState<Set<string>>(new Set()); // Track sending state per user
    const [sentTo, setSentTo] = useState<Set<string>>(new Set()); // Track sent success per user
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setSearchQuery("");
            setSentTo(new Set());
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied!");
        } catch (err) {
            toast.error("Failed to copy");
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "TingoBingo Tangii",
                    text: title,
                    url: url,
                });
            } catch (err) {
                console.log("Share canceled");
            }
        } else {
            toast.error("System sharing not supported on this device.");
        }
    };

    const handleSendToUser = async (user: any, chatId?: string) => {
        if (sendingTo.has(user.user_id) || sentTo.has(user.user_id)) return;

        // Optimistic UI
        setSendingTo(prev => new Set(prev).add(user.user_id));

        try {
            // Ensure we have a conversation ID
            let targetChatId = chatId;
            if (!targetChatId) {
                targetChatId = await startConversation(user.user_id);
            }

            // Send message with link
            // Note: In a real app, you might want a specific 'share' message type, 
            // but for now we'll just send text.
            await sendMessage(`${title}\n${url}`, null, undefined, targetChatId); // Explicitly pass chat ID

            setSentTo(prev => new Set(prev).add(user.user_id));
            toast.success(`Sent to ${user.name}`);

        } catch (error) {
            console.error("Share failed", error);
            toast.error("Failed to send");
        } finally {
            setSendingTo(prev => {
                const next = new Set(prev);
                next.delete(user.user_id);
                return next;
            });
        }
    };

    // Filter conversations for search
    const filteredContacts = conversations.flatMap(c =>
        c.participants.map(p => ({
            ...p.user,
            user_id: p.user_id,
            chatId: c.id
        }))
    ).filter((u, index, self) =>
        // Unique users only
        index === self.findIndex(t => t.user_id === u.user_id) &&
        // Search filter
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isVisible && !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`
                relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden
                transform transition-all duration-300 ease-out flex flex-col max-h-[85vh]
                ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 sm:translate-y-10'}
            `}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <h3 className="font-bold text-lg text-gray-900">Share to...</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* External Share Row */}
                <div className="p-5 flex gap-4 overflow-x-auto no-scrollbar border-b border-gray-100 bg-gray-50/50">
                    <ShareOption
                        icon={Copy}
                        label="Copy Link"
                        onClick={handleCopyLink}
                        color="bg-gray-200 text-gray-700 hover:bg-gray-300"
                    />
                    <ShareOption
                        icon={Smartphone}
                        label="More..."
                        onClick={handleNativeShare}
                        color="bg-gray-200 text-gray-700 hover:bg-gray-300"
                    />
                    <SocialShareButton
                        platform="whatsapp"
                        url={url}
                        text={title}
                    />
                    <SocialShareButton
                        platform="twitter"
                        url={url}
                        text={title}
                    />
                </div>

                {/* Search */}
                <div className="p-4 pb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search friends..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                    </div>
                </div>

                {/* Friends List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-400 text-sm">Loading friends...</div>
                    ) : filteredContacts.length > 0 ? (
                        filteredContacts.map(user => (
                            <div key={user.user_id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm text-gray-900">{user.name}</span>
                                        <span className="text-xs text-gray-400">TingoBingo Friend</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleSendToUser(user, user.chatId)}
                                    disabled={sendingTo.has(user.user_id) || sentTo.has(user.user_id)}
                                    className={`
                                        px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300
                                        ${sentTo.has(user.user_id)
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-200 active:scale-95'
                                        }
                                    `}
                                >
                                    {sendingTo.has(user.user_id) ? (
                                        <span className="animate-pulse">Sending...</span>
                                    ) : sentTo.has(user.user_id) ? (
                                        <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Sent</span>
                                    ) : (
                                        "Send"
                                    )}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            {searchQuery ? "No friends found matching search" : "No recent conversations"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ShareOption({ icon: Icon, label, onClick, color }: any) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-2 min-w-[70px] group">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-active:scale-95 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-gray-600">{label}</span>
        </button>
    );
}

function SocialShareButton({ platform, url, text }: { platform: 'whatsapp' | 'twitter' | 'facebook', url: string, text: string }) {
    const getLink = () => {
        const encodedUrl = encodeURIComponent(url);
        const encodedText = encodeURIComponent(text);

        switch (platform) {
            case 'whatsapp': return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
            case 'twitter': return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
            case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        }
    };

    const colors = {
        whatsapp: "bg-green-500 text-white hover:bg-green-600",
        twitter: "bg-blue-400 text-white hover:bg-blue-500",
        facebook: "bg-blue-600 text-white hover:bg-blue-700"
    };

    const icons = {
        whatsapp: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>,
        twitter: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>,
        facebook: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
    };

    const Icon = icons[platform];

    return (
        <a
            href={getLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 min-w-[70px] group"
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-active:scale-95 ${colors[platform]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium text-gray-600 capitalize">{platform}</span>
        </a>
    )
}
