import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        // Supabase client is already imported

        const body = await request.json();
        const {
            user_id, // Get user_id from body
            alert_type,
            title,
            description,
            latitude,
            longitude,
            location_address,
            pet_id,
            pet_name,
            pet_breed,
            pet_description,
            pet_image_url,
            contact_phone,
            contact_method = 'chat',
        } = body;

        // Check authentication (via user_id presence)
        if (!user_id) {
            return NextResponse.json(
                { error: 'Unauthorized: Missing User ID' },
                { status: 401 }
            );
        }

        // Validate required fields
        if (!alert_type || !title || !description || !latitude || !longitude) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create emergency alert
        const { data: alert, error: alertError } = await supabase
            .from('emergency_alerts')
            .insert({
                user_id, // Use the passed user_id
                alert_type,
                title,
                description,
                latitude,
                longitude,
                location_address,
                pet_id,
                pet_name,
                pet_breed,
                pet_description,
                pet_image_url,
                contact_phone,
                contact_method,
            })
            .select()
            .single();

        if (alertError) {
            console.error('Error creating alert:', alertError);
            return NextResponse.json(
                { error: 'Failed to create alert' },
                { status: 500 }
            );
        }

        // Find nearby users to notify (within 10km)
        const { data: nearbyUsers, error: nearbyError } = await supabase
            .rpc('find_nearby_users', {
                alert_lat: latitude,
                alert_lng: longitude,
                max_distance_km: 10,
            });

        if (!nearbyError && nearbyUsers && nearbyUsers.length > 0) {
            // Create notifications for nearby users
            const notifications = nearbyUsers
                .filter((u: any) => u.user_id !== user_id) // Don't notify the alert creator
                .map((u: any) => ({
                    alert_id: alert.id,
                    notified_user_id: u.user_id,
                    distance_km: u.distance_km,
                }));

            if (notifications.length > 0) {
                await supabase
                    .from('alert_notifications')
                    .insert(notifications);
            }
        }

        // Update user's last known location
        await supabase
            .from('users')
            .update({
                last_known_latitude: latitude,
                last_known_longitude: longitude,
                last_location_update: new Date().toISOString(),
            })
            .eq('id', user_id);

        return NextResponse.json({
            success: true,
            alert,
            notified_count: nearbyUsers?.length || 0,
        });
    } catch (error) {
        console.error('Error in create alert API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
