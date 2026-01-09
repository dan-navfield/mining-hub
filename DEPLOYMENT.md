# Mining Hub - Vercel Deployment Guide

## Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Supabase Project**: Set up production database at [supabase.com](https://supabase.com)

## Deployment Steps

### 1. Connect GitHub to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the `mining-hub` repository

### 2. Configure Project Settings

**Framework Preset**: Next.js
**Root Directory**: `apps/web`
**Build Command**: `cd ../.. && npm run build:web`
**Output Directory**: `.next`
**Install Command**: `cd ../.. && npm install`

### 3. Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

#### Required Variables
```
NEXT_PUBLIC_APP_NAME=Mining Hub
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_BASE_URL=https://your-deployment.vercel.app
ABN_LOOKUP_GUID=8838d356-4f03-432f-80eb-670608098598
```

#### Optional Variables
```
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token
DATABASE_URL=your-supabase-database-url
```

### 4. Supabase Configuration

1. **Create Production Project** in Supabase
2. **Run Migrations**: Use Supabase CLI or Dashboard
3. **Configure RLS Policies**: Ensure proper security policies
4. **Update Environment Variables**: Use production Supabase URL and keys

### 5. Domain Configuration

1. **Custom Domain** (Optional): Add in Vercel Dashboard → Domains
2. **SSL Certificate**: Automatically handled by Vercel

## Post-Deployment

### 1. Test Deployment
- Verify all pages load correctly
- Test authentication flows
- Check API endpoints functionality
- Verify database connections

### 2. Monitor Performance
- Use Vercel Analytics
- Set up error monitoring (Sentry)
- Monitor API response times

### 3. Continuous Deployment
- Automatic deployments on GitHub push
- Preview deployments for pull requests
- Production deployments on main branch

## Troubleshooting

### Build Errors
- Check build logs in Vercel Dashboard
- Verify all dependencies are in package.json
- Ensure environment variables are set

### Runtime Errors
- Check Function Logs in Vercel Dashboard
- Verify Supabase connection
- Check API endpoint configurations

### Performance Issues
- Use Vercel Speed Insights
- Optimize images and assets
- Review bundle size

## API Deployment (Alternative)

If you need to deploy the NestJS API separately:

1. **Railway/Render**: For dedicated API hosting
2. **Vercel Functions**: For serverless API (current setup)
3. **Docker**: For containerized deployment

## Security Checklist

- [ ] Environment variables are properly set
- [ ] Supabase RLS policies are configured
- [ ] API endpoints are secured
- [ ] CORS is properly configured
- [ ] Authentication is working
- [ ] Database access is restricted

## Monitoring & Maintenance

1. **Regular Updates**: Keep dependencies updated
2. **Security Patches**: Monitor for vulnerabilities
3. **Performance Monitoring**: Track Core Web Vitals
4. **Error Tracking**: Monitor application errors
5. **Database Maintenance**: Regular backups and optimization

## Support

For deployment issues:
1. Check Vercel documentation
2. Review build logs
3. Test locally first
4. Check environment variable configuration
