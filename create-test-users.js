const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testUsers = [
  {
    email: 'admin@hethetrack.com',
    password: 'TestAdmin123!',
    user_metadata: {
      name: 'Sarah Mitchell',
      user_type: 'platform_admin',
      company: 'HetheTrack'
    }
  },
  {
    email: 'consultant@hetherington.com.au',
    password: 'TestConsultant123!',
    user_metadata: {
      name: 'James Thompson', 
      user_type: 'business_user',
      company: 'Hetherington Mining Consultants'
    }
  },
  {
    email: 'client@miningcorp.com.au',
    password: 'TestClient123!',
    user_metadata: {
      name: 'Michael Chen',
      user_type: 'client', 
      company: 'Australian Mining Corp'
    }
  }
];

async function createTestUsers() {
  console.log('Creating test users...');
  
  for (const user of testUsers) {
    try {
      console.log(`Creating user: ${user.email}`);
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: user.user_metadata,
        email_confirm: true
      });
      
      if (error) {
        console.error(`Error creating ${user.email}:`, error.message);
      } else {
        console.log(`✅ Created user: ${user.email}`);
      }
    } catch (error) {
      console.error(`Failed to create ${user.email}:`, error.message);
    }
  }
  
  console.log('✅ Test user creation complete!');
}

createTestUsers().catch(console.error);
