# Test Users for Development

This document outlines the test users available for development and testing of the Mining Hub authentication system.

## Available Test Users

### 1. Platform Admin
- **Email**: `admin@hethetrack.com`
- **Password**: `TestAdmin123!`
- **User Type**: `platform_admin`
- **Name**: Sarah Mitchell
- **Company**: HetheTrack
- **Access**: Full system access, admin features

### 2. Business User (Consultant)
- **Email**: `consultant@hetherington.com.au`
- **Password**: `TestConsultant123!`
- **User Type**: `business_user`
- **Name**: James Thompson
- **Company**: Hetherington Mining Consultants
- **Access**: Tenement management, client data

### 3. Client (Tenement Holder)
- **Email**: `client@miningcorp.com.au`
- **Password**: `TestClient123!`
- **User Type**: `client`
- **Name**: Michael Chen
- **Company**: Australian Mining Corp
- **Access**: Own tenement data, basic features

## How to Use

### Option 1: Quick Fill (Development Mode)
1. Go to `/auth/login`
2. In development mode, you'll see a "Development Test Users" section
3. Click on any user type to automatically fill the login form
4. Click "Continue" to sign in

### Option 2: Manual Entry
1. Go to `/auth/login`
2. Enter the email and password for any test user above
3. Click "Continue" to sign in

### Option 3: Create Users in Supabase
If the test users don't exist in your Supabase instance:

1. Make sure you have the required environment variables:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ABN_LOOKUP_GUID=your_abn_lookup_guid
   ```

2. Run the creation script:
   ```bash
   cd apps/web
   node scripts/create-test-users.js
   ```

## ABN Lookup Integration

The application now includes Australian Business Number (ABN) lookup functionality:

### Setup ABN Lookup
1. Add your ABN Lookup GUID to your `.env` file:
   ```bash
   ABN_LOOKUP_GUID=8838d356-4f03-432f-80eb-670608098598
   ```

2. Test the functionality at `/demo/abn-lookup`

### Features
- **Real-time ABN validation**: Validates ABN format and checksum
- **Business name search**: Find businesses by name
- **ABN details lookup**: Get full business details by ABN
- **GST status**: Shows GST registration status
- **Location data**: State and postcode information

## User Type Differences

### Platform Admin Features
- Access to admin panel (`/admin`)
- User management
- System configuration
- All tenement data across jurisdictions

### Business User Features
- Client management
- Tenement management for assigned clients
- Compliance tracking
- Reporting tools

### Client Features
- View own tenements
- Basic compliance information
- Contact consultant
- Limited reporting

## OAuth Testing

The system also supports:
- **Google OAuth**: Click "Continue with Google"
- **Microsoft OAuth**: Click "Continue with Microsoft"

Note: OAuth users will need to select their user type during the signup flow.

## Security Notes

⚠️ **Important**: These test users are for development only and should never be used in production environments.

- All test users have simple, predictable passwords
- Email confirmation is automatically bypassed
- User metadata is pre-populated

## Troubleshooting

### User Already Exists Error
If you see "User already registered" when creating test users, they already exist in your Supabase instance.

### Authentication Errors
1. Check that your Supabase configuration is correct
2. Verify the user exists in your Supabase Auth dashboard
3. Ensure email confirmation is not required for test users

### Permission Errors
Different user types have different access levels. If you can't access certain features:
1. Check you're logged in as the correct user type
2. Verify the middleware is correctly checking user permissions
3. Check the user's `user_type` in their metadata
