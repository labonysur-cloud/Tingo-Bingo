"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase"; // Use the public client for simplicity with our permissive RLS
import { uploadToCloudinary } from "@/lib/cloudinary";

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string | null;
    media_url: string | null;
    media_type: 'image' | 'video' | 'gif' | null;
    created_at: string;
    read_at: string | null;
}

export interface Conversation {
    id: string;
    participants: {
        user_id: string;
        user: {
            name: string;
            avatar: string;
        };
    }[];
    last_message?: Message;
    unread_count?: number;
}

interface ChatContextType {
    conversations: Conversation[];
    activeConversationId: string | null;
    activeConversation: Conversation | null;
    messages: Message[];
    isLoading: boolean;
    setActiveConversationId: (id: string | null) => void;
    sendMessage: (content: string, file?: File | null, mediaType?: 'image' | 'video' | 'gif') => Promise<void>;
    startConversation: (userId: string) => Promise<string>; // Returns conversation ID
    refreshConversations: () => Promise<void>;
    onlineUsers: Set<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Real-time subscription ref
    const subscriptionRef = useRef<any>(null);

    // 1. Fetch Conversations
    const fetchConversations = async () => {
        if (!user) return;

        try {
            // Get all conversations user is part of
            const { data: participations, error: partError } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', user.id);

            if (partError) throw partError;

            const conversationIds = participations.map(p => p.conversation_id);

            if (conversationIds.length === 0) {
                setConversations([]);
                setIsLoading(false);
                return;
            }

            // Fetch conversation details + participants + last message
            const { data: convs, error: convError } = await supabase
                .from('conversations')
                .select(`
                    id,
                    updated_at,
                    conversation_participants (
                        user_id
                    )
                `)
                .in('id', conversationIds)
                .order('updated_at', { ascending: false });

            if (convError) throw convError;

            // Enrich with user details (could be optimized with a view or better query)
            // For now, we fetch user details manually to be safe
            const enrichedConversations = await Promise.all(convs.map(async (conv: any) => {
                const participantIds = conv.conversation_participants.map((p: any) => p.user_id);
                const otherUserId = participantIds.find((pid: string) => pid !== user.id) || user.id; // Self chat fallback

                const { data: userData } = await supabase
                    .from('users')
                    .select('name, avatar')
                    .eq('id', otherUserId)
                    .single();

                // Fetch last message
                const { data: lastMsg } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', conv.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                return {
                    id: conv.id,
                    participants: [{
                        user_id: otherUserId,
                        user: {
                            name: userData?.name || 'Unknown User',
                            avatar: userData?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown'
                        }
                    }],
                    last_message: lastMsg || undefined
                };
            }));

            setConversations(enrichedConversations);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Fetch Messages for Active Conversation
    useEffect(() => {
        if (!activeConversationId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', activeConversationId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error("Error fetching messages:", error);
            } else {
                setMessages(data || []);
            }
        };

        fetchMessages();

        // Subscribe to NEW messages in this conversation
        const channel = supabase
            .channel(`chat:${activeConversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${activeConversationId}`
            }, (payload) => {
                const newMessage = payload.new as Message;
                setMessages(prev => [...prev, newMessage]);

                // Also update conversation last_message
                setConversations(prev => prev.map(c => {
                    if (c.id === activeConversationId) {
                        return { ...c, last_message: newMessage };
                    }
                    return c;
                }));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeConversationId]);

    // Initial load
    useEffect(() => {
        fetchConversations();
    }, [user]);

    // 3. Send Message
    const sendMessage = async (content: string, file?: File | null, mediaType?: 'image' | 'video' | 'gif') => {
        if (!user || !activeConversationId) return;

        try {
            let mediaUrl = null;
            if (file) {
                mediaUrl = await uploadToCloudinary(file);
            }

            const newMessage = {
                conversation_id: activeConversationId,
                sender_id: user.id,
                content: content || null,
                media_url: mediaUrl,
                media_type: mediaType || (file ? 'image' : null)
            };

            // Optimistic update (optional, but Realtime is fast enough generally)

            const { error } = await supabase
                .from('messages')
                .insert(newMessage);

            if (error) throw error;

            // Update conversation timestamp
            await supabase
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', activeConversationId);

        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    };

    // 4. Start New Conversation
    const startConversation = async (targetUserId: string): Promise<string> => {
        if (!user) {
            console.warn("Attempted to start conversation without user");
            return "";
        }

        try {
            // Check existing locally first
            // Robust check: finds ANY conversation where the participant exists
            const existing = conversations.find(c =>
                c.participants.some(p => p.user_id === targetUserId)
            );

            if (existing) {
                console.log("Found existing conversation:", existing.id);
                setActiveConversationId(existing.id);
                return existing.id;
            }

            // Call RPC (or manual check/insert if RPC fails)
            const { data: convId, error } = await supabase
                .rpc('get_or_create_conversation', {
                    user_a: user.id,
                    user_b: targetUserId
                });

            if (error) {
                // Fallback if RPC permissions fail (though we set them up)
                console.error("RPC Error:", error);
                throw error;
            }

            // Refresh list
            await fetchConversations();
            setActiveConversationId(convId);
            return convId;
        } catch (error) {
            console.error("Error starting conversation:", error);
            throw error;
        }
    };

    const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    // Presence Subscription
    useEffect(() => {
        if (!user) return;

        const presenceChannel = supabase.channel('global-presence')
            .on('presence', { event: 'sync' }, () => {
                const newState = presenceChannel.presenceState();
                const userIds = new Set<string>();

                // Extract all user IDs from presence state
                Object.keys(newState).forEach(key => {
                    newState[key].forEach((payload: any) => {
                        if (payload.user_id) userIds.add(payload.user_id);
                    });
                });

                setOnlineUsers(userIds);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        user_id: user.id,
                        online_at: new Date().toISOString()
                    });
                }
            });

        return () => {
            supabase.removeChannel(presenceChannel);
        };
    }, [user]);

    // ... existing message subscription code ...

    return (
        <ChatContext.Provider value={{
            conversations,
            activeConversationId,
            activeConversation,
            messages,
            isLoading,
            setActiveConversationId,
            sendMessage,
            startConversation,
            refreshConversations: fetchConversations,
            onlineUsers // Export this
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
}
