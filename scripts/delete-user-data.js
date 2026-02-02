/**
 * Delete User Data from Supabase
 * 
 * Use this script after manually deleting a user from Firebase Console
 * to clean up their Supabase data.
 * 
 * Usage:
 *   node scripts/delete-user-data.js USER_ID_HERE
 * 
 * Example:
 *   node scripts/delete-user-data.js abc123xyz789
 */

const userId = process.argv[2];

if (!userId) {
    console.error('❌ Error: User ID required');
    console.log('Usage: node scripts/delete-user-data.js USER_ID');
    process.exit(1);
}

async function deleteUserData(userId) {
    console.log(`🗑️  Deleting Supabase data for user: ${userId}`);

    try {
        const response = await fetch('http://localhost:3000/api/delete-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Deletion failed');
        }

        console.log('✅ Success:', result.message);
        console.log('🎉 User data deleted from Supabase');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

deleteUserData(userId);
