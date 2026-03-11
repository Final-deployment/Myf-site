
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixUsers() {
    console.log('Starting user verification fix...');

    const emails = ['admin@example.com', 'ahmed@example.com'];

    for (const email of emails) {
        console.log(`Processing ${email}...`);

        // 1. Get user ID from Auth
        const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
            console.error(`Error listing users: ${listError.message}`);
            continue;
        }

        const users = data.users;
        const user = users.find(u => u.email === email);
        if (!user) {
            console.log(`User ${email} not found in Auth. Skipping.`);
            continue;
        }

        console.log(`User ID for ${email}: ${user.id}`);

        // 2. Update Auth (Confirm Email)
        const { data: updateAuthData, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
        );

        if (updateAuthError) {
            console.error(`Error confirming email for ${email} in Auth: ${updateAuthError.message}`);
        } else {
            console.log(`Successfully confirmed email for ${email} in Auth.`);
        }

        // 3. Update Profile Table
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .update({ email_verified: true, status: 'active' })
            .eq('id', user.id);

        if (profileError) {
            console.error(`Error updating profile for ${email}: ${profileError.message}`);
        } else {
            console.log(`Successfully updated profile status for ${email} in 'users' table.`);
        }
    }

    console.log('User verification fix complete.');
}

fixUsers().catch(err => {
    console.error('Unexpected error:', err);
});
