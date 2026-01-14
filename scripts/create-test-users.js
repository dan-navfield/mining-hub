#!/usr/bin/env node

/**
 * Script to create test users in Supabase for development
 * Run with: node scripts/create-test-users.js
 */

const { createClient } = require('@supabase/supabase-js');

// Test users data
const testUsers = [
  {
    email: 'admin@hethetrack.com',
    password: 'TestAdmin123!',
    user_metadata: {
      first_name: 'Sarah',
      last_name: 'Mitchell',
      full_name: 'Sarah Mitchell',
      company: 'HetheTrack',
      user_type: 'platform_admin'
    }
  },
  {
    email: 'consultant@hetherington.com.au',
    password: 'TestConsultant123!',
    user_metadata: {
      first_name: 'James',
      last_name: 'Thompson',
      full_name: 'James Thompson',
      company: 'Hetherington Mining Consultants',
      user_type: 'business_user'
    }
  },
  {
    email: 'client@miningcorp.com.au',
    password: 'TestClient123!',
    user_metadata: {
      first_name: 'Michael',
      last_name: 'Chen',
      full_name: 'Michael Chen',
      company: 'Australian Mining Corp',
      user_type: 'client'
    }
  }
];

async function createTestUsers() {
  // Use local Supabase instance
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

  console.log('🔗 Using Supabase URL:', supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🚀 Creating test users...\n');

  for (const userData of testUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: userData.user_metadata,
        email_confirm: true // Auto-confirm email for test users
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`⚠️  User ${userData.email} already exists`);
        } else {
          console.error(`❌ Error creating ${userData.email}:`, error.message);
        }
      } else {
        console.log(`✅ Created ${userData.user_metadata.user_type}: ${userData.email}`);
        console.log(`   Name: ${userData.user_metadata.full_name}`);
        console.log(`   Company: ${userData.user_metadata.company}\n`);
      }
    } catch (err) {
      console.error(`❌ Unexpected error creating ${userData.email}:`, err.message);
    }
  }

  console.log('🎉 Test user creation completed!');
  console.log('\n📝 Test User Credentials:');
  console.log('========================');
  
  testUsers.forEach(user => {
    console.log(`\n${user.user_metadata.user_type.toUpperCase()}:`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Name: ${user.user_metadata.full_name}`);
    console.log(`Company: ${user.user_metadata.company}`);
  });

  console.log('\n💡 You can now use these credentials to test different user types in your application!');
}

// Run the script
createTestUsers().catch(console.error);
