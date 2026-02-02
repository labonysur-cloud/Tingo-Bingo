import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getWelcomeEmailTemplate, getLoginNotificationTemplate, getPasswordChangeTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const { type, to, name, ...extraData } = await request.json();

        if (!process.env.RESEND_API_KEY) {
            console.warn('⚠️ RESEND_API_KEY not configured, skipping email');
            return NextResponse.json({ success: false, message: 'Email service not configured' });
        }

        let subject = '';
        let html = '';

        switch (type) {
            case 'welcome':
                subject = '🐾 Welcome to TingoBingo!';
                html = getWelcomeEmailTemplate(name);
                break;

            case 'login':
                subject = '🔐 New Login Detected';
                html = getLoginNotificationTemplate(
                    name,
                    extraData.location || 'Unknown',
                    extraData.time || new Date().toLocaleString()
                );
                break;

            case 'password-change':
                subject = '✅ Password Changed Successfully';
                html = getPasswordChangeTemplate(name);
                break;

            default:
                return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
        }

        await sendEmail({ to, subject, html });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('❌ Email API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
