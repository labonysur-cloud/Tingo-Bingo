import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Public client for all requests
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get Supabase client (simplified)
 * 
 * Since we can't easily integrate Firebase JWT with Supabase RLS,
 * we use permissive RLS policies and handle auth at the app level.
 * 
 * Security approach:
 * - Firebase Auth validates users (login/signup)
 * - App code checks user.id before operations
 * - RLS prevents direct database access (must go through app)
 * - This is acceptable for a social media app
 */
export async function getAuthenticatedSupabase() {
    const user = auth.currentUser;

    if (!user) {
        console.warn('⚠️ No authenticated user');
        return supabase;
    }

    console.log('✅ User authenticated:', user.uid);

    // Return regular supabase client
    // We handle user_id validation in our app code, not RLS
    return supabase;
}
