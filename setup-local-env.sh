#!/bin/bash

# Setup local environment variables for Supabase
echo "Setting up local environment variables..."

# API environment
cat > apps/api/.env << EOF
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
REDIS_URL=redis://localhost:6379
SENDGRID_API_KEY=
WFS_ENDPOINT=https://public-services.slip.wa.gov.au/public/services/SLIP_Public_Services/Industry_and_Mining_WFS/MapServer/WFSServer
MTO_XML_FETCH_ENABLED=true
MTO_XML_SOURCE_URL=
JWT_SECRET=your-jwt-secret-key-here
NODE_ENV=development
EOF

# Web environment
cat > apps/web/.env << EOF
NEXT_PUBLIC_APP_NAME=HetheTrack
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_SENTRY_DSN=
EOF

echo "✅ Environment files created!"
echo "🚀 Local Supabase is running at:"
echo "   - API: http://127.0.0.1:54321"
echo "   - Studio: http://127.0.0.1:54323"
echo "   - Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo ""
echo "Next steps:"
echo "1. Run: chmod +x setup-local-env.sh && ./setup-local-env.sh"
echo "2. Run: npm install (if not done already)"
echo "3. Run: npm run dev"
