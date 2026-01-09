#!/bin/bash

# Production Supabase Environment Variables for Vercel
echo "Setting up Vercel environment variables..."

# Supabase Configuration
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://bhsedtlphawiahmbndpc.supabase.co"
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoc2VkdGxwaGF3aWFobWJuZHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NzQ5MjksImV4cCI6MjA3NjE1MDkyOX0.aEyOyBNdJfJKNhJhEsInR5cCI6IkpXVCJ9"
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoc2VkdGxwaGF3aWFobWJuZHBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU3NDkyOSwiZXhwIjoyMDc2MTUwOTI5fQ.Vg82vmpz80KclhQnscAESR2TY9tP8q-ZpCaPq0KQjiU"

# Application Configuration
npx vercel env add NEXT_PUBLIC_APP_NAME production <<< "Mining Hub"
npx vercel env add NODE_ENV production <<< "production"
npx vercel env add NEXT_TELEMETRY_DISABLED production <<< "1"

# ABN Lookup Service
npx vercel env add ABN_LOOKUP_GUID production <<< "8838d356-4f03-432f-80eb-670608098598"

# WA Government API Configuration
npx vercel env add WFS_ENDPOINT production <<< "https://public-services.slip.wa.gov.au/public/services/SLIP_Public_Services/Industry_and_Mining_WFS/MapServer/WFSServer"
npx vercel env add MTO_XML_FETCH_ENABLED production <<< "true"

# JWT Secret
npx vercel env add JWT_SECRET production <<< "mining-hub-production-jwt-secret-2026"

echo "Environment variables configured!"
