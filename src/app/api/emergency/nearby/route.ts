import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        // Supabase client is already imported

        const searchParams = request.nextUrl.searchParams;
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const radius = searchParams.get('radius') || '10';

        // Validate required parameters
        if (!lat || !lng) {
            return NextResponse.json(
                { error: 'Missing latitude or longitude' },
                { status: 400 }
            );
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const maxDistance = parseInt(radius);

        if (isNaN(latitude) || isNaN(longitude) || isNaN(maxDistance)) {
            return NextResponse.json(
                { error: 'Invalid parameters' },
                { status: 400 }
            );
        }

        // Find nearby active alerts
        const { data: alerts, error } = await supabase
            .rpc('find_nearby_alerts', {
                user_lat: latitude,
                user_lng: longitude,
                max_distance_km: maxDistance,
                limit_count: 20,
            });

        if (error) {
            console.error('Error fetching nearby alerts:', error);
            return NextResponse.json(
                { error: 'Failed to fetch alerts' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            alerts: alerts || [],
            count: alerts?.length || 0,
        });
    } catch (error) {
        console.error('Error in nearby alerts API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
