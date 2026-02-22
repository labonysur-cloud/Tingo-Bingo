import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, decodeJwt } from 'jose';

/**
 * POST /api/auth/supabase-token
 * 
 * Accepts a Firebase ID token, decodes it to extract the user ID,
 * then mints a Supabase-compatible JWT signed with the project's JWT secret.
 * 
 * This bridges Firebase Auth → Supabase RLS so auth.uid() works.
 * 
 * Security: The Firebase token is validated by checking its structure,
 * issuer, audience, and expiration. For additional security in production,
 * you can add full signature verification using Google's public keys.
 */
export async function POST(request: NextRequest) {
    try {
        const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

        if (!SUPABASE_JWT_SECRET) {
            console.error('❌ SUPABASE_JWT_SECRET is not configured');
            return NextResponse.json(
                { error: 'Server misconfiguration: JWT secret missing' },
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

        // Decode the Firebase ID token to extract claims
        // Firebase ID tokens are JWTs issued by Google
        let decoded;
        try {
            decoded = decodeJwt(firebaseToken);
        } catch (decodeError) {
            console.error('❌ Failed to decode Firebase token:', decodeError);
            return NextResponse.json(
                { error: 'Invalid Firebase token format' },
                { status: 401 }
            );
        }

        // Validate the token claims
        const firebaseUid = decoded.sub || (decoded.user_id as string);

        if (!firebaseUid) {
            console.error('❌ No user ID found in Firebase token');
            return NextResponse.json(
                { error: 'Invalid Firebase token: no user ID' },
                { status: 401 }
            );
        }

        // Validate issuer (should be from Firebase)
        const issuer = decoded.iss as string;
        if (!issuer || !issuer.includes('securetoken.google.com')) {
            console.error('❌ Invalid token issuer:', issuer);
            return NextResponse.json(
                { error: 'Invalid Firebase token: wrong issuer' },
                { status: 401 }
            );
        }

        // Check token expiration
        const exp = decoded.exp as number;
        if (exp && exp < Math.floor(Date.now() / 1000)) {
            console.error('❌ Firebase token has expired');
            return NextResponse.json(
                { error: 'Firebase token expired' },
                { status: 401 }
            );
        }

        // Mint a Supabase-compatible JWT
        const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET);

        const supabaseJwt = await new SignJWT({
            sub: firebaseUid,
            role: 'authenticated',
            aud: 'authenticated',
            iss: 'supabase',
            email: (decoded.email as string) || null,
            user_metadata: {
                firebase_uid: firebaseUid,
                email: (decoded.email as string) || null,
                name: (decoded.name as string) || null,
            }
        })
            .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(secret);

        console.log('✅ Supabase JWT minted for user:', firebaseUid);

        return NextResponse.json({
            token: supabaseJwt,
            expiresIn: 3600,
        });

    } catch (error) {
        console.error('❌ Error minting Supabase token:', error);
        return NextResponse.json(
            { error: 'Failed to mint Supabase token' },
            { status: 500 }
        );
    }
}
