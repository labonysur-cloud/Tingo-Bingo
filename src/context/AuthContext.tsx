"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    User as FirebaseUser
} from "firebase/auth";

// Define our User type (extending simple properties for UI)
export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    username?: string;  // Optional unique username
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signup: (name: string, email: string, pass: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Helper: Ensure user exists in Supabase
    const ensureSupabaseProfile = async (firebaseUser: FirebaseUser) => {
        try {
            // Check if user exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('id', firebaseUser.uid)
                .single();

            // If doesn't exist, create profile
            if (!existingUser) {
                console.log('📝 Creating Supabase profile for new user:', firebaseUser.uid);

                const { error } = await supabase
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
                // Ensure Supabase profile exists
                await ensureSupabaseProfile(currentUser);

                setUser({
                    id: currentUser.uid,
                    name: currentUser.displayName || "Pet Lover",
                    email: currentUser.email || "",
                    avatar: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`,
                });
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

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
            // Don't block login if email fails
        }
    };

    const signup = async (name: string, email: string, pass: string) => {
        // 1. Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);

        // 2. Update profile with Name and Random Avatar
        const randomAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userCredential.user.uid}`;

        await updateProfile(userCredential.user, {
            displayName: name,
            photoURL: randomAvatar
        });

        // 3. Force update local state
        setUser({
            id: userCredential.user.uid,
            name: name,
            email: email,
            avatar: randomAvatar,
        });

        // 4. Send welcome email
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
            // Don't block signup if email fails
        }
    };

    const loginWithGoogle = async () => {
        await signInWithPopup(auth, googleProvider);
        // onAuthStateChanged will handle profile creation and state update
    };

    const logout = async () => {
        await firebaseSignOut(auth);
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, signup, loginWithGoogle, logout, resetPassword }}>
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
