import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Public (anonymous) Supabase client.
 * Used for operations that don't need auth (viewing public profiles, etc.)
 * and as a fallback before the user is authenticated.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Create an authenticated Supabase client with a custom JWT.
 * This JWT contains the Firebase UID as `sub`, enabling auth.uid() in RLS.
 */
export function createAuthenticatedClient(jwt: string): SupabaseClient {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        },
        realtime: {
            params: {
                apikey: supabaseAnonKey,
            },
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        },
    });
}

/**
 * Singleton for the authenticated client.
 * Updated when the user logs in and gets a Supabase JWT.
 */
let _authenticatedClient: SupabaseClient | null = null;
let _currentJwt: string | null = null;

/**
 * Set the authenticated Supabase client with a new JWT.
 * Called from AuthContext when a new token is minted.
 */
export function setAuthenticatedClient(jwt: string): SupabaseClient {
    _currentJwt = jwt;
    _authenticatedClient = createAuthenticatedClient(jwt);
    return _authenticatedClient;
}

/**
 * Get the authenticated Supabase client.
 * Falls back to the anonymous client if no JWT is available.
 */
export function getSupabaseClient(): SupabaseClient {
    return _authenticatedClient || supabase;
}

/**
 * Get the current JWT (for passing to realtime auth).
 */
export function getCurrentJwt(): string | null {
    return _currentJwt;
}

/**
 * Clear the authenticated client (on logout).
 */
export function clearAuthenticatedClient(): void {
    _currentJwt = null;
    _authenticatedClient = null;
}
