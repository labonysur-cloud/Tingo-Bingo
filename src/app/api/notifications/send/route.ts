import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { getSupabaseClient } from '@/lib/supabase';

// Setup VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@tingobingo.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export async function POST(req: NextRequest) {
    try {
        const { userId, title, body, url = '/' } = await req.json();

        if (!userId || !title || !body) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const supabase = getSupabaseClient();
        
        // Fetch all subscriptions for this user
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ success: true, message: 'No active subscriptions found' });
        }

        const results = await Promise.allSettled(subscriptions.map(async (sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            const payload = JSON.stringify({
                title,
                body,
                url
            });

            return webpush.sendNotification(pushSubscription, payload);
        }));

        console.log(`Push attempted for user ${userId}. Successful: ${results.filter(r => r.status === 'fulfilled').length}`);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Push Dispatch Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to dispatch notifications' },
            { status: 500 }
        );
    }
}
