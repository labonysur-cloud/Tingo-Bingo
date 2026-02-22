"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { getSupabaseClient, getCurrentJwt } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";

export interface Message {
    id: string;
    chat_id: string;
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
    supabaseReady: boolean;
    setActiveConversationId: (id: string | null) => void;
    sendMessage: (content: string, file?: File | null, mediaType?: 'image' | 'video' | 'gif', explicitChatId?: string) => Promise<void>;
    startConversation: (userId: string) => Promise<string>;
    refreshConversations: () => Promise<void>;
    onlineUsers: Set<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { user, supabaseReady } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    // Get the authenticated Supabase client (re-evaluated when supabaseReady changes)
    // This ensures we use the JWT-authenticated client for all operations
    const client = useMemo(() => getSupabaseClient(), [supabaseReady]);

    // ==========================================
    // 1. Fetch Conversations
    // ==========================================
    const fetchConversations = useCallback(async () => {
        if (!user || !supabaseReady) return;

        try {
            const { data: chats, error: chatsError } = await client
                .from('chats')
                .select('*')
                .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
                .order('updated_at', { ascending: false });

            if (chatsError) throw chatsError;

            if (!chats || chats.length === 0) {
                setConversations([]);
                setIsLoading(false);
                return;
            }

            const enrichedConversations = await Promise.all(chats.map(async (chat: any) => {
                const otherUserId = chat.participant_1 === user.id ? chat.participant_2 : chat.participant_1;

                const { data: userData } = await client
                    .from('users')
                    .select('name, avatar')
                    .eq('id', otherUserId)
                    .single();

                const { data: lastMsg } = await client
                    .from('messages')
                    .select('*')
                    .eq('chat_id', chat.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                return {
                    id: chat.id,
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
    }, [user, client, supabaseReady]);

    // ==========================================
    // 2. Fetch Messages (runs ONCE per active conversation change)
    // ==========================================
    useEffect(() => {
        if (!activeConversationId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            console.log('📥 Fetching messages for chat:', activeConversationId);
            const { data, error } = await client
                .from('messages')
                .select('*')
                .eq('chat_id', activeConversationId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error("❌ Error fetching messages:", error);
            } else {
                console.log('✅ Fetched messages:', data?.length);
                setMessages(data || []);
            }
        };

        fetchMessages();
    }, [activeConversationId, client]);

    // ==========================================
    // 3. Realtime subscription for active conversation
    //    Stable — NOT torn down on send
    //    Uses authenticated client so RLS filters events
    // ==========================================
    useEffect(() => {
        if (!activeConversationId || !supabaseReady) return;

        console.log('🔔 Setting up authenticated realtime subscription for chat:', activeConversationId);

        const channel = client
            .channel(`chat:${activeConversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `chat_id=eq.${activeConversationId}`
            }, (payload) => {
                console.log('🔔 Real-time message received:', payload);
                const newMessage = payload.new as Message;

                // Deduplicate: only add if not already in state
                setMessages(prev => {
                    if (prev.some(m => m.id === newMessage.id)) {
                        console.log('⏭️ Skipping duplicate message:', newMessage.id);
                        return prev;
                    }
                    console.log('➕ Adding realtime message to UI:', newMessage.id);
                    return [...prev, newMessage];
                });

                // Update conversation last_message in sidebar
                setConversations(prev => prev.map(c => {
                    if (c.id === activeConversationId) {
                        return { ...c, last_message: newMessage };
                    }
                    return c;
                }));
            })
            .subscribe((status, err) => {
                console.log('🔔 Subscription status:', status);
                if (err) console.error('🔔 Subscription error:', err);
            });

        // Authenticate the realtime connection with our JWT
        const jwt = getCurrentJwt();
        if (jwt) {
            client.realtime.setAuth(jwt);
            console.log('🔐 Realtime auth set with Supabase JWT');
        }

        return () => {
            console.log('🔕 Removing subscription for chat:', activeConversationId);
            client.removeChannel(channel);
        };
    }, [activeConversationId, supabaseReady, client]);

    // ==========================================
    // 4. Global subscription for conversation list updates
    //    RLS ensures we only receive events for our own chats
    // ==========================================
    useEffect(() => {
        if (!user || !supabaseReady) return;

        const globalChannel = client
            .channel(`user-global-messages:${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            }, (payload) => {
                const newMessage = payload.new as Message;

                // Update conversations list
                setConversations(prev => {
                    const chatExists = prev.some(c => c.id === newMessage.chat_id);
                    if (chatExists) {
                        return prev.map(c => {
                            if (c.id === newMessage.chat_id) {
                                return { ...c, last_message: newMessage };
                            }
                            return c;
                        });
                    }
                    fetchConversations();
                    return prev;
                });
            })
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('🌐 Global messages subscription active (secured by RLS)');
                }
                if (err) console.error('🌐 Global subscription error:', err);
            });

        // Authenticate the realtime connection
        const jwt = getCurrentJwt();
        if (jwt) {
            client.realtime.setAuth(jwt);
        }

        return () => {
            client.removeChannel(globalChannel);
        };
    }, [user, supabaseReady, client, fetchConversations]);

    // ==========================================
    // 5. Initial load
    // ==========================================
    useEffect(() => {
        fetchConversations();
    }, [user, fetchConversations]);

    // ==========================================
    // 6. Send Message (optimistic update, no refetch)
    // ==========================================
    const sendMessage = async (content: string, file?: File | null, mediaType?: 'image' | 'video' | 'gif', explicitChatId?: string) => {
        const targetChatId = explicitChatId || activeConversationId;

        console.log('📤 sendMessage called');
        console.log('User:', user?.id);
        console.log('Target chat:', targetChatId);

        if (!user || !targetChatId) {
            console.error('❌ Cannot send - missing user or chat ID');
            return;
        }

        try {
            let mediaUrl = null;
            if (file) {
                console.log('📸 Uploading media...');
                mediaUrl = await uploadToCloudinary(file);
                console.log('✅ Media uploaded:', mediaUrl);
            }

            const newMessage = {
                chat_id: targetChatId,
                sender_id: user.id,
                content: content || null,
                media_url: mediaUrl,
                media_type: mediaType || (file ? 'image' : null)
            };

            const { data, error } = await client
                .from('messages')
                .insert(newMessage)
                .select();

            if (error) {
                console.error('❌ Insert error:', error);
                throw error;
            }

            console.log('✅ Message inserted successfully:', data);

            // Optimistic update with deduplication
            if (data && data[0]) {
                const sentMessage = data[0] as Message;
                setMessages(prev => {
                    if (prev.some(m => m.id === sentMessage.id)) return prev;
                    return [...prev, sentMessage];
                });

                setConversations(prev => prev.map(c => {
                    if (c.id === targetChatId) {
                        return { ...c, last_message: sentMessage };
                    }
                    return c;
                }));
            }

            // Update chat timestamp (uses correct targetChatId)
            const { error: updateError } = await client
                .from('chats')
                .update({
                    updated_at: new Date().toISOString(),
                    last_message: content || 'Media'
                })
                .eq('id', targetChatId);

            if (updateError) {
                console.error('⚠️ Chat update error:', updateError);
            }

        } catch (error) {
            console.error("❌ Error sending message:", error);
            alert(`Failed to send message: ${error}`);
            throw error;
        }
    };

    // ==========================================
    // 7. Start New Conversation
    // ==========================================
    const startConversation = async (targetUserId: string): Promise<string> => {
        if (!user || !supabaseReady) {
            console.warn("Attempted to start conversation without user or before auth ready");
            return "";
        }

        try {
            const existing = conversations.find(c =>
                c.participants.some(p => p.user_id === targetUserId)
            );

            if (existing) {
                setActiveConversationId(existing.id);
                return existing.id;
            }

            const { data: existingChats } = await client
                .from('chats')
                .select('id')
                .or(`and(participant_1.eq.${user.id},participant_2.eq.${targetUserId}),and(participant_1.eq.${targetUserId},participant_2.eq.${user.id})`)
                .limit(1)
                .single();

            if (existingChats) {
                setActiveConversationId(existingChats.id);
                await fetchConversations();
                return existingChats.id;
            }

            const { data: newChat, error } = await client
                .from('chats')
                .insert({
                    participant_1: user.id,
                    participant_2: targetUserId
                })
                .select('id')
                .single();

            if (error) throw error;

            await fetchConversations();
            setActiveConversationId(newChat.id);
            return newChat.id;
        } catch (error) {
            console.error("Error starting conversation:", error);
            throw error;
        }
    };

    const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

    // ==========================================
    // 8. Presence Subscription
    // ==========================================
    useEffect(() => {
        if (!user) return;

        const presenceChannel = client.channel('global-presence')
            .on('presence', { event: 'sync' }, () => {
                const newState = presenceChannel.presenceState();
                const userIds = new Set<string>();

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
            client.removeChannel(presenceChannel);
        };
    }, [user, client]);

    return (
        <ChatContext.Provider value={{
            conversations,
            activeConversationId,
            activeConversation,
            messages,
            isLoading,
            supabaseReady,
            setActiveConversationId,
            sendMessage,
            startConversation,
            refreshConversations: fetchConversations,
            onlineUsers
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
