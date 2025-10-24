import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  console.log('Service Key:', process.env.SUPABASE_SERVICE_KEY ? 'Set (length: ' + process.env.SUPABASE_SERVICE_KEY.length + ')' : 'NOT SET');

  try {
    // Try to fetch admin users
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, name, is_active')
      .limit(5);

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    console.log('✅ Connection successful!');
    console.log('Admin users found:', data.length);
    console.log('Users:', JSON.stringify(data, null, 2));

    // Check for specific admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'admin@euda-portal.com')
      .single();

    if (adminError) {
      console.log('❌ Admin user not found:', adminError.message);
    } else {
      console.log('✅ Admin user exists:', adminUser.email);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testConnection();
