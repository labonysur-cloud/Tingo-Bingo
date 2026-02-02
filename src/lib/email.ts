import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'TingoBingo <onboarding@resend.dev>', // Change after domain verification
            to,
            subject,
            html,
        });

        if (error) {
            console.error('❌ Email send error:', error);
            throw error;
        }

        console.log('✅ Email sent successfully:', data);
        return data;
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        throw error;
    }
}

export function getWelcomeEmailTemplate(name: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF6B2C 0%, #FF8C42 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .button { display: inline-block; padding: 14px 32px; background: #FF6B2C; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .emoji { font-size: 48px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐾 Welcome to TingoBingo!</h1>
        </div>
        <div class="content">
            <div class="emoji">🎉</div>
            <h2>Hey ${name}!</h2>
            <p>We're thrilled to have you join the fluffiest community on the internet! TingoBingo is where pet lovers unite to share, connect, and celebrate their furry (or scaly, or feathery) friends.</p>
            
            <p><strong>What's next?</strong></p>
            <ul>
                <li>🐶 Add your pet's profile</li>
                <li>📸 Share your first post</li>
                <li>💬 Connect with other pet parents</li>
                <li>🎮 Explore fun features</li>
            </ul>
            
            <a href="https://tingo-bingo.vercel.app/profile/edit" class="button">Complete Your Profile</a>
            
            <p>Need help? We're here for you! Just reply to this email or visit our <a href="https://tingo-bingo.vercel.app/faq">FAQ page</a>.</p>
            
            <p>Happy posting! 🎉</p>
            <p><strong>The TingoBingo Team</strong></p>
        </div>
        <div class="footer">
            <p>🐾 TingoBingo - The Pet's Social Media</p>
            <p>You're receiving this because you created an account at TingoBingo.</p>
        </div>
    </div>
</body>
</html>
    `;
}

export function getLoginNotificationTemplate(name: string, location: string, time: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1A1A1A; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .info-box { background: #F8F9FA; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B2C; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .warning { background: #FFF3CD; padding: 15px; border-radius: 8px; border-left: 4px solid #FFC107; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 New Login Detected</h1>
        </div>
        <div class="content">
            <p>Hi ${name},</p>
            <p>We detected a new login to your TingoBingo account.</p>
            
            <div class="info-box">
                <strong>Login Details:</strong><br>
                📍 Location: ${location}<br>
                🕐 Time: ${time}
            </div>
            
            <p>If this was you, you can safely ignore this email.</p>
            
            <div class="warning">
                <strong>⚠️ Wasn't you?</strong><br>
                If you didn't log in, please change your password immediately and contact our support team.
            </div>
            
            <p>Stay safe!<br><strong>The TingoBingo Team</strong></p>
        </div>
        <div class="footer">
            <p>🐾 TingoBingo - The Pet's Social Media</p>
        </div>
    </div>
</body>
</html>
    `;
}

export function getPasswordChangeTemplate(name: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28A745; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .success { background: #D4EDDA; padding: 15px; border-radius: 8px; border-left: 4px solid #28A745; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Password Changed Successfully</h1>
        </div>
        <div class="content">
            <p>Hi ${name},</p>
            
            <div class="success">
                <strong>✅ Your password has been changed</strong><br>
                Your TingoBingo account password was successfully updated.
            </div>
            
            <p>If you made this change, no further action is needed.</p>
            
            <p><strong>Didn't change your password?</strong><br>
            If you didn't make this change, please contact us immediately at support@tingobingo.com</p>
            
            <p>Stay secure!<br><strong>The TingoBingo Team</strong></p>
        </div>
        <div class="footer">
            <p>🐾 TingoBingo - The Pet's Social Media</p>
        </div>
    </div>
</body>
</html>
    `;
}
