import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create Supabase client for server-side API routes
 * This uses the anon key for user operations
 */
export async function createClient() {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
