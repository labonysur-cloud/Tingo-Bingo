const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const client = new Client({
    connectionString,
});

async function run() {
    try {
        await client.connect();
        const sql = fs.readFileSync('d:\\TingoBingo\\supabase-follows.sql', 'utf8');
        await client.query(sql);
        console.log('Migration applied successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await client.end();
    }
}

run();
