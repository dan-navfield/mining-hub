# Next.js Security Update - December 11, 2025

## Critical Security Vulnerabilities Fixed

This update addresses two critical security vulnerabilities in React Server Components:

### CVE-2025-55184 (High Severity) - Denial of Service
- **Impact**: Specially crafted HTTP requests can cause infinite loops, hanging the server
- **Affected**: All App Router endpoints using React Server Components
- **Fix**: Complete fix provided in Next.js 14.2.35

### CVE-2025-55183 (Medium Severity) - Source Code Exposure  
- **Impact**: Malicious requests can expose compiled source code of Server Functions
- **Risk**: Business logic and potentially hardcoded secrets could be revealed
- **Fix**: Patched in Next.js 14.2.35

## Changes Applied

### 1. Next.js Version Update
- **Before**: `next@13.4.19` (vulnerable)
- **After**: `next@14.2.35` (patched)
- **File**: `apps/web/package.json`

### 2. ESLint Config Update
- **Before**: `eslint-config-next@13.4.19`
- **After**: `eslint-config-next@14.2.35`
- **File**: `apps/web/package.json`

### 3. Next.js Configuration Cleanup
- Removed deprecated `experimental.appDir` option (App Router is stable in Next.js 14)
- **File**: `apps/web/next.config.js`

### 4. Node.js Version Update
- **Before**: Node.js 18
- **After**: Node.js 20
- **Files**: 
  - `.github/workflows/deploy.yml`
  - `.env.vercel.example`

## Required Actions

### Immediate (Critical)
1. **Install Dependencies**: Run `npm install` to update Next.js
2. **Test Locally**: Verify application builds and runs correctly
3. **Deploy**: Push changes to trigger production deployment

### Vercel Configuration
Update Vercel project settings:
- Set Node.js version to 20.x in project settings
- Verify environment variables are properly configured

### Testing Checklist
- [ ] Application builds successfully (`npm run build`)
- [ ] Development server starts (`npm run dev`)
- [ ] All pages load correctly
- [ ] Server Actions and API routes function properly
- [ ] Authentication flows work
- [ ] Map functionality operates correctly

## Security Best Practices Applied

1. **Immediate Upgrade**: No workaround available - upgrade was mandatory
2. **Version Pinning**: Using exact version `14.2.35` for security
3. **Runtime Environment**: Updated to Node.js 20 for latest security patches
4. **CI/CD Pipeline**: Updated GitHub Actions to use secure Node.js version

## Verification

After deployment, verify the fix by checking:
- Application responds normally to requests
- No infinite loops or hanging requests
- Server Functions execute without exposing source code
- All existing functionality remains intact

## References

- [Next.js Security Update Blog Post](https://nextjs.org/blog/security-update-2025-12-11)
- [CVE-2025-55184 - Denial of Service](https://www.cve.org/CVERecord?id=CVE-2025-55184)
- [CVE-2025-55183 - Source Code Exposure](https://www.cve.org/CVERecord?id=CVE-2025-55183)
- [React Blog: Security Advisory](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components)

---

**Status**: ✅ Security patches applied  
**Next.js Version**: 14.2.35 (patched)  
**Node.js Version**: 20.x  
**Deployment**: Ready for production
