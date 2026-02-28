const { createClient } = require('@supabase/supabase-js');
const url = 'https://pcyfdsdiqssgiibjikmi.supabase.co';
const key = 'sb_publishable_DLXnPS3WKAjkr-1F_a1qWQ_FK4xLaO9'; // ANON KEY
const sb = createClient(url, key);

async function run() {
    const { data: auth, error: loginErr } = await sb.auth.signInWithPassword({ email: 'maithteeth@gmail.com', password: 'keita009g' });
    if (loginErr) { console.error('Login error:', loginErr); process.exit(1); }

    // Check companies
    const { data: comp } = await sb.from('companies').select('*');
    console.log('Companies visible to super admin:', comp);
    process.exit(0);
}

run();
