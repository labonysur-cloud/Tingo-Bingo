import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(request: NextRequest) {
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
        const { alert_id, status, resolved_by } = body;

        // Validate required fields
        if (!alert_id || !status) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify user owns the alert
        const { data: alert, error: alertError } = await supabase
            .from('emergency_alerts')
            .select('user_id')
            .eq('id', alert_id)
            .single();

        if (alertError || !alert) {
            return NextResponse.json(
                { error: 'Alert not found' },
                { status: 404 }
            );
        }

        if (alert.user_id !== user.id) {
            return NextResponse.json(
                { error: 'You can only update your own alerts' },
                { status: 403 }
            );
        }

        // Update alert status
        const updateData: any = { status };

        if (status === 'resolved') {
            updateData.resolved_at = new Date().toISOString();
            if (resolved_by) {
                updateData.resolved_by = resolved_by;
            }
        }

        const { data: updatedAlert, error: updateError } = await supabase
            .from('emergency_alerts')
            .update(updateData)
            .eq('id', alert_id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating alert:', updateError);
            return NextResponse.json(
                { error: 'Failed to update alert' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            alert: updatedAlert,
        });
    } catch (error) {
        console.error('Error in update alert API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
