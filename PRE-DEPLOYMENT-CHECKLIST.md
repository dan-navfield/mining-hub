# Pre-Deployment Checklist

## ✅ Code Preparation

- [ ] All code committed and pushed to GitHub
- [ ] No sensitive data in code (API keys, passwords, etc.)
- [ ] Environment variables properly configured
- [ ] Build process tested locally
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Linting issues resolved

## ✅ Vercel Configuration

- [ ] Vercel account created and connected to GitHub
- [ ] Project imported from GitHub repository
- [ ] Framework preset set to "Next.js"
- [ ] Root directory set to "apps/web"
- [ ] Build command configured: `cd ../.. && npm run build:web`
- [ ] Output directory set to ".next"
- [ ] Install command configured: `cd ../.. && npm install`

## ✅ Environment Variables

### Required Variables (Set in Vercel Dashboard)
- [ ] `NEXT_PUBLIC_APP_NAME` = "Mining Hub"
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = Production Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Production Supabase anon key
- [ ] `NEXT_PUBLIC_API_BASE_URL` = Vercel deployment URL
- [ ] `ABN_LOOKUP_GUID` = "8838d356-4f03-432f-80eb-670608098598"

### Optional Variables
- [ ] `NEXT_PUBLIC_SENTRY_DSN` = Sentry error tracking
- [ ] `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` = Mapbox token
- [ ] `DATABASE_URL` = Direct database connection (if needed)

## ✅ Supabase Setup

- [ ] Production Supabase project created
- [ ] Database migrations applied
- [ ] Row Level Security (RLS) policies configured
- [ ] API keys generated and secured
- [ ] Database connection tested
- [ ] Authentication providers configured

## ✅ External Services

- [ ] ABN Lookup service tested with production GUID
- [ ] Mapbox token configured (if using maps)
- [ ] Sentry project created (if using error tracking)
- [ ] Any third-party APIs tested

## ✅ Security

- [ ] All API endpoints secured
- [ ] Authentication flows tested
- [ ] CORS properly configured
- [ ] No sensitive data exposed in client-side code
- [ ] Environment variables not committed to git
- [ ] Database access properly restricted

## ✅ Performance

- [ ] Images optimized
- [ ] Bundle size analyzed
- [ ] Core Web Vitals tested
- [ ] API response times acceptable
- [ ] Database queries optimized

## ✅ Testing

- [ ] All features tested locally
- [ ] Authentication flows working
- [ ] API endpoints responding correctly
- [ ] Database operations successful
- [ ] Error handling working properly

## ✅ Documentation

- [ ] README.md updated with deployment info
- [ ] DEPLOYMENT.md guide created
- [ ] Environment variables documented
- [ ] API documentation current

## ✅ Monitoring Setup

- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring setup
- [ ] Alert notifications configured

## 🚀 Deployment Steps

1. **Push to GitHub**: Ensure all code is committed and pushed
2. **Import to Vercel**: Connect GitHub repo to Vercel
3. **Configure Settings**: Set framework, directories, and commands
4. **Set Environment Variables**: Add all required variables
5. **Deploy**: Trigger first deployment
6. **Test**: Verify all functionality works in production
7. **Monitor**: Watch for any errors or issues

## 📋 Post-Deployment Verification

- [ ] Site loads correctly
- [ ] Authentication works
- [ ] Database connections successful
- [ ] API endpoints responding
- [ ] Maps displaying (if applicable)
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile responsive

## 🔧 Troubleshooting

If deployment fails:
1. Check build logs in Vercel dashboard
2. Verify environment variables are set correctly
3. Ensure all dependencies are in package.json
4. Test build process locally
5. Check for any missing files or configurations

## 📞 Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Actions**: https://docs.github.com/en/actions
