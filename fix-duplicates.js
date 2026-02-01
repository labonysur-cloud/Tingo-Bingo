const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars. URL:", !!supabaseUrl, "Key:", !!supabaseKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("🚀 Starting database cleanup...");

    // 1. DUPLICATES
    const { data: convs, error } = await supabase
        .from('conversations')
        .select(`
            id,
            conversation_participants (user_id)
        `);

    if (error) {
        console.error("❌ Error fetching conversations:", error);
        return;
    }

    // Identify duplicates
    const map = {};
    for (const c of convs) {
        const parts = c.conversation_participants.map(p => p.user_id).sort().join(',');
        if (!map[parts]) map[parts] = [];
        map[parts].push(c.id);
    }

    for (const key in map) {
        if (map[key].length > 1) {
            console.log(`⚠️  Duplicate found for [${key}]: ${map[key].length} chats.`);
            const ids = map[key];
            const keep = ids[0];
            const trash = ids.slice(1);

            console.log(`   Keeping ${keep}, merging messages...`);

            // Move messages
            for (const t of trash) {
                const { error: moveErr } = await supabase
                    .from('messages')
                    .update({ conversation_id: keep })
                    .eq('conversation_id', t);

                if (moveErr) console.error("   Failed to move msgs:", moveErr);

                // Delete
                const { error: delErr } = await supabase
                    .from('conversations')
                    .delete()
                    .eq('id', t);

                if (!delErr) console.log(`   ✅ Deleted duplicate ${t}`);
            }
        }
    }

    // 2. CHECK MESSAGES (406 Error Debug)
    console.log("\n🔍 Analyzing latest messages...");
    const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (msgs) {
        for (const m of msgs) {
            const urlLen = m.media_url ? m.media_url.length : 0;
            console.log(`   MSG ${m.id.substring(0, 8)}: media_url length = ${urlLen}`);
            if (urlLen > 500) {
                console.warn(`   ⚠️  POSSIBLE BASE64 detected! (${urlLen} chars)`);
                console.log(`   Header: ${m.media_url.substring(0, 50)}`);
            }
        }
    }

    console.log("Done.");
}

main();
