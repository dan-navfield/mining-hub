import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route patterns
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/callback',
  '/terms',
  '/privacy',
  '/support',
  '/api/*'  // Allow all API routes
];

const authRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email'
];

// Routes that require specific user types
const adminRoutes = [
  '/admin'
];

const businessRoutes = [
  '/business'
];

// Helper function to check if a path matches any pattern
function matchesPattern(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern || path.startsWith(pattern + '/');
  });
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({ name, value, ...options });
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          req.cookies.set({ name, value: '', ...options });
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;
  
  // Allow public routes
  if (matchesPattern(pathname, publicRoutes)) {
    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (session && matchesPattern(pathname, authRoutes)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return res;
  }

  // Check if user is authenticated
  if (!session) {
    // Store the intended destination
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check user type for protected routes
  const userType = session.user?.user_metadata?.user_type || session.user?.app_metadata?.user_type;

  // Admin routes - only platform admins
  if (matchesPattern(pathname, adminRoutes) && userType !== 'platform_admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Business routes - platform admins and business users
  if (matchesPattern(pathname, businessRoutes) && 
      !['platform_admin', 'business_user'].includes(userType)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Email verification check for certain routes
  const emailVerified = session.user?.email_confirmed_at !== null;
  const requiresVerification = ['/dashboard', '/map', '/tenements'];
  
  if (!emailVerified && matchesPattern(pathname, requiresVerification)) {
    return NextResponse.redirect(new URL('/auth/verify-email', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
