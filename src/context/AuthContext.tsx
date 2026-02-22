"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { supabase, setAuthenticatedClient, clearAuthenticatedClient, getSupabaseClient, getCurrentJwt } from "@/lib/supabase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    deleteUser,
    User as FirebaseUser
} from "firebase/auth";

// Define our User type
export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    username?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    supabaseReady: boolean;  // True when authenticated Supabase client is ready
    login: (email: string, pass: string) => Promise<void>;
    signup: (name: string, email: string, pass: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [supabaseReady, setSupabaseReady] = useState(false);
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Mint a Supabase JWT from the Firebase token.
     * This bridges Firebase Auth → Supabase RLS.
     */
    const mintSupabaseToken = useCallback(async (firebaseUser: FirebaseUser): Promise<boolean> => {
        try {
            // Get the Firebase ID token
            const firebaseToken = await firebaseUser.getIdToken();

            // Exchange it for a Supabase JWT via our API route
            const response = await fetch('/api/auth/supabase-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firebaseToken }),
            });

            if (!response.ok) {
                const err = await response.json();
                console.error('❌ Failed to mint Supabase token:', err.error, err.detail || '');
                return false;
            }

            const { token, expiresIn } = await response.json();

            // Set the authenticated Supabase client
            setAuthenticatedClient(token);
            setSupabaseReady(true);
            console.log('✅ Supabase authenticated client ready');

            // Schedule token refresh (refresh 5 minutes before expiry)
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
            const refreshMs = (expiresIn - 300) * 1000; // 5 min before expiry
            refreshTimerRef.current = setTimeout(async () => {
                console.log('🔄 Refreshing Supabase token...');
                const currentUser = auth.currentUser;
                if (currentUser) {
                    await mintSupabaseToken(currentUser);
                }
            }, refreshMs);

            return true;
        } catch (error) {
            console.error('❌ Error minting Supabase token:', error);
            return false;
        }
    }, []);

    // Helper: Ensure user exists in Supabase
    const ensureSupabaseProfile = async (firebaseUser: FirebaseUser) => {
        try {
            // Use the authenticated client if available, otherwise anon
            const client = getSupabaseClient();

            const { data: existingUser } = await client
                .from('users')
                .select('id')
                .eq('id', firebaseUser.uid)
                .single();

            if (!existingUser) {
                console.log('📝 Creating Supabase profile for new user:', firebaseUser.uid);

                const { error } = await client
                    .from('users')
                    .insert({
                        id: firebaseUser.uid,
                        name: firebaseUser.displayName || 'Pet Lover',
                        email: firebaseUser.email,
                        avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                        username: null,
                        bio: null,
                        location: null
                    });

                if (error) {
                    console.error('❌ Failed to create Supabase profile:', error);
                } else {
                    console.log('✅ Supabase profile created successfully');
                }
            }
        } catch (error) {
            console.error('⚠️ Error ensuring Supabase profile:', error);
        }
    };

    // Listen for Firebase Auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Step 1: Mint Supabase JWT (bridges Firebase → Supabase RLS)
                const tokenMinted = await mintSupabaseToken(currentUser);
                if (tokenMinted) {
                    console.log('🔐 Supabase JWT minted, auth bridge active');
                }

                // Step 2: Ensure Supabase profile exists
                await ensureSupabaseProfile(currentUser);

                // Step 3: Fetch user data from Supabase
                try {
                    const client = getSupabaseClient();
                    const { data: userData, error } = await client
                        .from('users')
                        .select('*')
                        .eq('id', currentUser.uid)
                        .single();

                    if (error) throw error;

                    setUser({
                        id: currentUser.uid,
                        name: userData.name || currentUser.displayName || "Pet Lover",
                        email: currentUser.email || "",
                        avatar: userData.avatar || currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`,
                        username: userData.username
                    });
                } catch (error) {
                    console.error('Error fetching user from Supabase:', error);
                    setUser({
                        id: currentUser.uid,
                        name: currentUser.displayName || "Pet Lover",
                        email: currentUser.email || "",
                        avatar: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`,
                    });
                }
            } else {
                setUser(null);
                setSupabaseReady(false);
                clearAuthenticatedClient();

                // Clear refresh timer
                if (refreshTimerRef.current) {
                    clearTimeout(refreshTimerRef.current);
                    refreshTimerRef.current = null;
                }
            }
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
        };
    }, [mintSupabaseToken]);

    const login = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);

        // Send login notification email
        try {
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'login',
                    to: email,
                    name: auth.currentUser?.displayName || 'User',
                    location: 'Web Browser',
                    time: new Date().toLocaleString()
                })
            });
            console.log('📧 Login notification email sent');
        } catch (error) {
            console.error('Failed to send login notification:', error);
        }
    };

    const signup = async (name: string, email: string, pass: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);

        const randomAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userCredential.user.uid}`;

        await updateProfile(userCredential.user, {
            displayName: name,
            photoURL: randomAvatar
        });

        setUser({
            id: userCredential.user.uid,
            name: name,
            email: email,
            avatar: randomAvatar,
        });

        // Send welcome email
        try {
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'welcome',
                    to: email,
                    name: name
                })
            });
            console.log('📧 Welcome email sent');
        } catch (error) {
            console.error('Failed to send welcome email:', error);
        }
    };

    const loginWithGoogle = async () => {
        await signInWithPopup(auth, googleProvider);
        // onAuthStateChanged will handle profile creation, JWT minting, and state update
    };

    const logout = async () => {
        clearAuthenticatedClient();
        setSupabaseReady(false);
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
        await firebaseSignOut(auth);
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const deleteAccount = async () => {
        if (!auth.currentUser || !user) {
            throw new Error('No user logged in');
        }

        const userId = auth.currentUser.uid;

        const response = await fetch('/api/delete-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete account');
        }

        await deleteUser(auth.currentUser);

        clearAuthenticatedClient();
        setSupabaseReady(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, supabaseReady, login, signup, loginWithGoogle, logout, resetPassword, deleteAccount }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
