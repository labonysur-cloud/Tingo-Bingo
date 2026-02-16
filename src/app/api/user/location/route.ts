import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        // Supabase client is already imported

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { latitude, longitude } = body;

        // Validate required fields
        if (!latitude || !longitude) {
            return NextResponse.json(
                { error: 'Missing latitude or longitude' },
                { status: 400 }
            );
        }

        // Update user's last known location
        const { error: updateError } = await supabase
            .from('users')
            .update({
                last_known_latitude: latitude,
                last_known_longitude: longitude,
                last_location_update: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error updating location:', updateError);
            return NextResponse.json(
                { error: 'Failed to update location' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error('Error in update location API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
