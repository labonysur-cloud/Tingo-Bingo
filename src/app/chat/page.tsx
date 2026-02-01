"use client";

import { ChatProvider, useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef, Suspense } from "react";
import { ArrowLeft, Send, Image as ImageIcon, Search, Phone, Video, Info, MoreVertical } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

// ===========================================
// SUB-COMPONENTS
// ===========================================

function ChatSidebar() {
    const { conversations, activeConversationId, setActiveConversationId, isLoading, onlineUsers } = useChat();
    const router = useRouter();

    return (
        <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 bg-white flex flex-col h-full ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/')} className="md:hidden">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <h1 className="text-xl font-bold font-display">Messages</h1>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-500">{conversations.length}</span>
                </div>
            </div>

            <div className="p-3">
                <div className="bg-gray-100 rounded-xl px-4 py-2 flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        className="bg-transparent border-none outline-none text-sm w-full"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Loading chats...</div>
                ) : conversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <p>No conversations yet.</p>
                        <p className="text-sm">Visit a profile to send a message!</p>
                    </div>
                ) : (
                    // Dedupe conversations by other user ID to prevent UI duplicate glitches
                    Array.from(new Map(conversations.map(c => [c.participants[0]?.user_id, c])).values())
                        .map(conv => {
                            const participant = conv.participants[0];
                            const otherUser = participant?.user || { name: 'Unknown', avatar: '' };
                            const otherUserId = participant?.user_id;
                            const otherUserKey = otherUserId ?? ((participant as any)?.user?.id) ?? '';
                            const isActive = conv.id === activeConversationId;

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveConversationId(conv.id)}
                                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${isActive ? 'bg-purple-50 border-r-2 border-purple-500' : ''}`}
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 relative">
                                            <Image
                                                src={otherUser.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=unknown"}
                                                alt={otherUser.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        {/* Online indicator (Real) */}
                                        {otherUserKey && onlineUsers.has(otherUserKey) && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-gray-900 truncate ${isActive ? 'text-purple-900' : ''}`}>
                                            {otherUser.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 truncate">
                                            {conv.last_message?.content || (conv.last_message?.media_url ? "Sent an image" : "Start chatting")}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                        {conv.last_message ? new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </button>
                            );
                        })
                )}
            </div>
        </div>
    );
}

function ChatWindow() {
    const { activeConversation, messages, sendMessage, setActiveConversationId, onlineUsers } = useChat();
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSending, setIsSending] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        try {
            await sendMessage(newMessage); // Removed file arg
            setNewMessage("");
        } catch (error: any) {
            console.error("Failed to send message:", error);
            alert(`Failed to send: ${error.message || "Unknown error"}`);
        } finally {
            setIsSending(false);
        }
    };

    if (!activeConversation) {
        return (
            <div className={`flex-1 flex flex-col items-center justify-center bg-gray-50 text-center p-8 hidden md:flex`}>
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Send className="w-10 h-10 text-purple-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Messages</h2>
                <p className="text-gray-500 max-w-sm">
                    Select a conversation from the left to start chatting or visit a profile to send a new message.
                </p>
            </div>
        );
    }

    const otherUser = activeConversation.participants[0].user;

    return (
        <div className={`flex-1 flex flex-col h-full bg-white relative ${!activeConversation ? 'hidden' : 'flex'}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActiveConversationId(null)} className="md:hidden">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 relative">
                        <Image src={otherUser.avatar} alt={otherUser.name} fill className="object-cover" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900">{otherUser.name}</h2>
                        {onlineUsers.has(activeConversation.participants[0].user_id) ? (
                            <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                Online
                            </span>
                        ) : (
                            <span className="text-xs text-gray-400 font-medium">Offline</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                    <button className="hover:text-purple-600"><Info className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8F9FA]">
                {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === activeConversation.participants.find(p => p.user.name !== otherUser.name)?.user_id; // Correction needed here later, but for now logic is simpler
                    // BETTER: user from context
                    // We need user ID from context
                    return <MessageBubble key={msg.id} message={msg} />;
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 flex items-center">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="bg-transparent border-none outline-none w-full text-gray-900 placeholder:text-gray-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSending || !newMessage.trim()}
                        className="p-3 bg-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}

function MessageBubble({ message }: { message: any }) {
    const { user } = useAuth();
    if (!user) return null;

    const isMe = message.sender_id === user.id;

    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isMe
                ? 'bg-purple-600 text-white rounded-br-none'
                : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-none'
                }`}>
                {message.media_url && (
                    <div className="mb-2 rounded-lg overflow-hidden relative w-full aspect-square max-w-[200px]">
                        <Image
                            src={message.media_url}
                            alt="Attached"
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
                {message.content && <p className="text-sm leading-relaxed">{message.content}</p>}
                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
}


// ===========================================
// MAIN PAGE COMPONENT
// ===========================================

function ChatContent() {
    const searchParams = useSearchParams();
    const { startConversation, isLoading } = useChat();
    const userIdToStart = searchParams.get('user');

    useEffect(() => {
        // Only attempt to start conversation if we have an authenticated user and the target ID
        // The user check is handled within useChat(), but we need to wait for it here too
        const initChat = async () => {
            if (userIdToStart) {
                try {
                    await startConversation(userIdToStart);
                    // Remove param from URL to prevent re-running
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('user');
                    window.history.replaceState({}, '', newUrl.toString());
                } catch (error) {
                    console.error("Failed to auto-start chat:", error);
                }
            }
        };

        // We can check if 'isLoading' from chat context is false, but simplified check:
        // We'll trust startConversation handling, but wrap in try-catch and wait a tick if needed
        const timer = setTimeout(() => {
            initChat();
        }, 500); // Small delay to ensure auth state settles

        return () => clearTimeout(timer);
    }, [userIdToStart]);

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] bg-white md:rounded-2xl md:shadow-soft md:border md:border-gray-100 overflow-hidden md:mx-4 md:mb-4">
            <ChatSidebar />
            <ChatWindow />
        </div>
    );
}

export default function MessagesPage() {
    return (
        <ChatProvider>
            <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>}>
                <ChatContent />
            </Suspense>
        </ChatProvider>
    );
}
