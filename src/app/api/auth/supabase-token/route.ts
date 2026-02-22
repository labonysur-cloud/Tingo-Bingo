import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

/**
 * POST /api/auth/supabase-token
 * 
 * Accepts a Firebase ID token, verifies it via Google's public API,
 * then mints a Supabase-compatible JWT signed with the project's JWT secret.
 * 
 * This bridges Firebase Auth → Supabase RLS so auth.uid() works.
 */
export async function POST(request: NextRequest) {
    try {
        const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

        if (!SUPABASE_JWT_SECRET) {
            console.error('❌ SUPABASE_JWT_SECRET is not configured');
            return NextResponse.json(
                { error: 'Server misconfiguration: JWT secret missing', detail: 'SUPABASE_JWT_SECRET env var is not set' },
                { status: 500 }
            );
        }

        const { firebaseToken } = await request.json();

        if (!firebaseToken) {
            return NextResponse.json(
                { error: 'Missing firebaseToken in request body' },
                { status: 400 }
            );
        }

        // Verify the Firebase token via Google's tokeninfo endpoint
        // This is simpler than importing firebase-admin and works perfectly
        const verifyResponse = await fetch(
            `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: firebaseToken }),
            }
        );

        if (!verifyResponse.ok) {
            console.error('❌ Firebase token verification failed');
            return NextResponse.json(
                { error: 'Invalid Firebase token' },
                { status: 401 }
            );
        }

        const verifyData = await verifyResponse.json();
        const firebaseUser = verifyData.users?.[0];

        if (!firebaseUser?.localId) {
            return NextResponse.json(
                { error: 'Could not extract user from Firebase token' },
                { status: 401 }
            );
        }

        const firebaseUid = firebaseUser.localId;

        // Mint a Supabase-compatible JWT
        // The key claims Supabase needs: sub (user id), role, aud, exp, iat
        const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET);

        const supabaseJwt = await new SignJWT({
            sub: firebaseUid,
            role: 'authenticated',
            aud: 'authenticated',
            iss: 'supabase',
            // Include Firebase email if available for RLS policies that need it
            email: firebaseUser.email || null,
            user_metadata: {
                firebase_uid: firebaseUid,
                email: firebaseUser.email || null,
                name: firebaseUser.displayName || null,
            }
        })
            .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
            .setIssuedAt()
            .setExpirationTime('1h') // 1 hour expiry
            .sign(secret);

        console.log('✅ Supabase JWT minted for user:', firebaseUid);

        return NextResponse.json({
            token: supabaseJwt,
            expiresIn: 3600, // seconds
        });

    } catch (error) {
        console.error('❌ Error minting Supabase token:', error);
        return NextResponse.json(
            { error: 'Failed to mint Supabase token' },
            { status: 500 }
        );
    }
}
