'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function VerifyEmailPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResendEmail = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Get the current user's email from the URL or session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        setError('No email found. Please try signing up again.');
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Verification email sent! Please check your inbox.');
      }
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-xl mb-4">
            <div className="w-6 h-6 bg-white rounded-md transform rotate-45"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          {/* Email Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
            <Mail className="w-8 h-8 text-emerald-600" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Verify your email address
          </h2>
          
          <p className="text-gray-600 mb-6">
            We've sent a verification link to your email address. Please click the link in the email to activate your account.
          </p>

          {/* Status Messages */}
          {message && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-emerald-600">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Resend Button */}
          <button
            onClick={handleResendEmail}
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mb-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Resend verification email</span>
              </>
            )}
          </button>

          {/* Back to Login */}
          <Link
            href="/auth/login"
            className="inline-flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
          >
            <span>Back to login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">
              Didn't receive the email?
            </p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure you entered the correct email address</li>
              <li>• Try resending the verification email</li>
            </ul>
          </div>

          {/* Support Link */}
          <div className="mt-6">
            <p className="text-sm text-gray-500">
              Still having trouble?{' '}
              <Link href="/support" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
