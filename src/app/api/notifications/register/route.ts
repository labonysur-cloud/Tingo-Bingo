import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { subscription, userId } = await req.json();

        if (!subscription || !userId) {
            return NextResponse.json({ error: 'Missing subscription or userId' }, { status: 400 });
        }

        const supabase = getSupabaseClient();
        
        // Extract subscription details
        const { endpoint, keys } = subscription;
        const { p256dh, auth } = keys;

        // Upsert subscription
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: userId,
                endpoint,
                p256dh,
                auth
            }, { onConflict: 'user_id,endpoint' });

        if (error) {
            console.error('❌ Push Registration Database Error:', error.message, error.details);
            return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
        }

        console.log('✅ Push subscription saved for user:', userId);
        
        // Ensure the user record has push_enabled = true if it's currently unset
        await supabase.from('users').update({ push_enabled: true }).eq('id', userId).is('push_enabled', null);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Push Registration Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to register subscription' },
            { status: 500 }
        );
    }
}
