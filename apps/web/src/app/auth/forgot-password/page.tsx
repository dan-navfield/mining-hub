'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ForgotPasswordPage() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
              Password reset link sent
            </h2>
            
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <strong>{email}</strong>. 
              Please check your email and follow the instructions to reset your password.
            </p>

            {/* Back to Login */}
            <Link
              href="/auth/login"
              className="inline-flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to login</span>
            </Link>

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">
                Didn't receive the email?
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Check your spam or junk folder</li>
                <li>• Make sure you entered the correct email address</li>
                <li>• The link expires in 1 hour</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-xl mb-4">
            <div className="w-6 h-6 bg-white rounded-md transform rotate-45"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h1>
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Send reset link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to login</span>
            </Link>
          </div>

          {/* Support Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Need help?{' '}
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
