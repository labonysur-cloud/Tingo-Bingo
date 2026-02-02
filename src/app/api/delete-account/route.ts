import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * DELETE Account API Route
 * Permanently deletes user account and all associated data
 * 
 * POST /api/delete-account
 * Body: { userId: string }
 * 
 * Deletes:
 * - Supabase user profile (CASCADE deletes posts, pets, comments, likes, follows, messages)
 * - Note: Firebase Auth deletion must be done client-side
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        console.log(`🗑️ Deleting account for user: ${userId}`);

        // Get user email before deletion (for confirmation email)
        const { data: userData } = await supabase
            .from('users')
            .select('email, name')
            .eq('id', userId)
            .single();

        // Delete from Supabase (CASCADE will delete related data)
        const { error: supabaseError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (supabaseError) {
            console.error('❌ Supabase deletion error:', supabaseError);
            throw new Error('Failed to delete user data from database');
        }

        console.log('✅ User data deleted from Supabase (CASCADE deletes: posts, pets, comments, likes, follows, messages)');

        // Send confirmation email (optional - don't block if it fails)
        if (userData?.email) {
            try {
                await fetch(`${request.nextUrl.origin}/api/send-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'account-deleted',
                        to: userData.email,
                        name: userData.name || 'User'
                    })
                });
                console.log('✅ Confirmation email sent');
            } catch (emailError) {
                console.error('⚠️ Failed to send confirmation email:', emailError);
                // Don't block deletion if email fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Account and all associated data permanently deleted'
        });

    } catch (error: any) {
        console.error('❌ Account deletion error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete account' },
            { status: 500 }
        );
    }
}
