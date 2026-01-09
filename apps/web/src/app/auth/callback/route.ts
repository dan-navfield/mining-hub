import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const userType = requestUrl.searchParams.get('user_type');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_callback_error`);
      }

      if (data.user && userType) {
        // Update user metadata with user type if it was passed from OAuth
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            user_type: userType
          }
        });

        if (updateError) {
          console.error('Failed to update user type:', updateError);
        }
      }

      // Redirect to dashboard or appropriate page
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
    } catch (error) {
      console.error('Unexpected auth callback error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=unexpected_error`);
    }
  }

  // If no code, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`);
}
