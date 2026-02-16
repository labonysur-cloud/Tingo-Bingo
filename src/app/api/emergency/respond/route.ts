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
        const {
            alert_id,
            message,
            responder_latitude,
            responder_longitude,
        } = body;

        // Validate required fields
        if (!alert_id) {
            return NextResponse.json(
                { error: 'Missing alert_id' },
                { status: 400 }
            );
        }

        // Check if alert exists and is active
        const { data: alert, error: alertError } = await supabase
            .from('emergency_alerts')
            .select('*')
            .eq('id', alert_id)
            .single();

        if (alertError || !alert) {
            return NextResponse.json(
                { error: 'Alert not found' },
                { status: 404 }
            );
        }

        if (alert.status !== 'active') {
            return NextResponse.json(
                { error: 'Alert is no longer active' },
                { status: 400 }
            );
        }

        // Create response
        const { data: response, error: responseError } = await supabase
            .from('alert_responses')
            .insert({
                alert_id,
                responder_id: user.id,
                message,
                responder_latitude,
                responder_longitude,
            })
            .select()
            .single();

        if (responseError) {
            // Check if user already responded
            if (responseError.code === '23505') {
                return NextResponse.json(
                    { error: 'You have already responded to this alert' },
                    { status: 400 }
                );
            }

            console.error('Error creating response:', responseError);
            return NextResponse.json(
                { error: 'Failed to create response' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            response,
        });
    } catch (error) {
        console.error('Error in respond alert API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
