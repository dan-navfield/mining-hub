# Deploy Mining Hub to Vercel

## Prerequisites Complete ✅
- Project is configured for Vercel deployment
- Next.js config optimized for serverless
- Environment variables prepared
- Vercel.json configured for monorepo

## Step 1: Create Production Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project details:
   - Project URL: `https://your-project-id.supabase.co`
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. Run migrations in your Supabase project:
   ```bash
   # Connect to your production project
   supabase link --project-ref your-project-id
   
   # Push migrations
   supabase db push
   ```

## Step 2: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import from GitHub: `https://github.com/dan-navfield/mining-hub`
3. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && npm run build:web`
   - **Output Directory**: `.next`
   - **Install Command**: `cd ../.. && npm install`
   - **Node.js Version**: 20.x

## Step 3: Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

### Required Variables
```
NEXT_PUBLIC_APP_NAME=Mining Hub
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
NEXT_PUBLIC_API_BASE_URL=https://your-deployment.vercel.app
ABN_LOOKUP_GUID=8838d356-4f03-432f-80eb-670608098598
WFS_ENDPOINT=https://public-services.slip.wa.gov.au/public/services/SLIP_Public_Services/Industry_and_Mining_WFS/MapServer/WFSServer
MTO_XML_FETCH_ENABLED=true
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
JWT_SECRET=your-production-jwt-secret-key-here
```

## Step 4: Deploy

1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Your app will be available at: `https://your-deployment.vercel.app`

## Step 5: Post-Deployment Setup

1. **Test the deployment**:
   - Verify homepage loads
   - Test tenement data loading
   - Check API endpoints
   - Verify database connections

2. **Configure custom domain** (optional):
   - Add domain in Vercel Dashboard → Domains
   - Update DNS records as instructed

3. **Set up monitoring**:
   - Enable Vercel Analytics
   - Configure error tracking

## Troubleshooting

### Build Issues
- Check build logs in Vercel Dashboard
- Verify all environment variables are set
- Ensure Supabase project is accessible

### Runtime Issues
- Check Function Logs in Vercel Dashboard
- Verify Supabase connection strings
- Test API endpoints individually

### Database Issues
- Ensure migrations are applied to production Supabase
- Check RLS policies are configured
- Verify service role key permissions

## Success Checklist

- [ ] Supabase production project created
- [ ] Migrations applied to production database
- [ ] Environment variables configured in Vercel
- [ ] Deployment successful
- [ ] Homepage loads correctly
- [ ] Tenement data displays
- [ ] API endpoints working
- [ ] Authentication functional
- [ ] Map integration working

## Next Steps

After successful deployment:
1. Set up continuous deployment (automatic on GitHub push)
2. Configure monitoring and alerts
3. Set up backup strategies
4. Plan for scaling and optimization

Your Mining Hub application will be live at: `https://your-deployment.vercel.app`
