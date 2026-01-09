'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Users } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getTestUserCredentials } from '../../../data/test-users';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTestUsers, setShowTestUsers] = useState(false);

  const testUserCredentials = getTestUserCredentials();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        // Redirect to dashboard or appropriate page based on user type
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to sign in with Google');
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to sign in with Microsoft');
    }
  };

  const fillTestUser = (userType: 'Platform Admin' | 'Business User' | 'Client') => {
    const user = testUserCredentials[userType];
    setFormData({
      email: user.email,
      password: user.password
    });
    setError('');
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-xl mb-6">
              <div className="w-6 h-6 bg-white rounded-md transform rotate-45"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in to Mining Hub</h1>
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Get started →
              </Link>
            </p>
          </div>

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
                Enter your email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="alex@company.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Forgot your password?
              </Link>
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
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-3 mb-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Microsoft Sign In */}
            <button
              type="button"
              onClick={handleMicrosoftSignIn}
              className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#f25022" d="M1 1h10v10H1z"/>
                <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                <path fill="#7fba00" d="M1 13h10v10H1z"/>
                <path fill="#ffb900" d="M13 13h10v10H13z"/>
              </svg>
              <span>Continue with Microsoft</span>
            </button>
          </form>

          {/* Terms and Privacy */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to the{' '}
              <Link href="/terms" className="text-emerald-600 hover:text-emerald-700">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700">
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Support Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Need help?{' '}
              <Link href="/support" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Contact support
              </Link>
            </p>
          </div>

          {/* Development Test Users */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <button
                type="button"
                onClick={() => setShowTestUsers(!showTestUsers)}
                className="flex items-center space-x-2 text-sm font-medium text-yellow-800 hover:text-yellow-900"
              >
                <Users className="w-4 h-4" />
                <span>Development Test Users</span>
                <span className="text-xs">
                  {showTestUsers ? '▼' : '▶'}
                </span>
              </button>
              
              {showTestUsers && (
                <div className="mt-3 space-y-2">
                  {Object.entries(testUserCredentials).map(([userType, user]) => (
                    <button
                      key={userType}
                      type="button"
                      onClick={() => fillTestUser(userType as 'Platform Admin' | 'Business User' | 'Client')}
                      className="w-full text-left p-3 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{userType}</p>
                          <p className="text-xs text-gray-600">{user.name} • {user.company}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">Click to fill form</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  <p className="text-xs text-yellow-700 mt-2">
                    ⚠️ Development only - These users will be created automatically when you sign up.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Map Preview */}
      <div className="hidden lg:flex lg:flex-1 bg-gray-100 relative overflow-hidden">
        {/* Map Background - Western Australia Shape */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
          {/* Western Australia Outline */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid meet">
            {/* WA distinctive shape with Pilbara, Goldfields, and coastal features */}
            <path d="M80 50
                     L120 45
                     L160 50
                     L200 60
                     L240 80
                     L270 110
                     L290 140
                     L300 170
                     L310 200
                     L315 230
                     L320 260
                     L325 290
                     L330 320
                     L335 350
                     L340 380
                     L345 410
                     L350 440
                     L345 460
                     L335 470
                     L320 475
                     L300 470
                     L280 465
                     L260 460
                     L240 450
                     L220 440
                     L200 425
                     L180 410
                     L160 390
                     L140 370
                     L120 350
                     L100 330
                     L85 310
                     L75 290
                     L70 270
                     L65 250
                     L60 230
                     L55 210
                     L50 190
                     L45 170
                     L40 150
                     L35 130
                     L40 110
                     L50 90
                     L65 70
                     Z" 
                  fill="#e0f2fe" 
                  stroke="#0891b2" 
                  strokeWidth="3" 
                  opacity="0.7"/>
            
            {/* Major regions/shires indicated by subtle lines */}
            <line x1="80" y1="120" x2="280" y2="140" stroke="#64748b" strokeWidth="1" opacity="0.2"/>
            <line x1="100" y1="200" x2="300" y2="220" stroke="#64748b" strokeWidth="1" opacity="0.2"/>
            <line x1="120" y1="280" x2="320" y2="300" stroke="#64748b" strokeWidth="1" opacity="0.2"/>
            <line x1="140" y1="360" x2="330" y2="380" stroke="#64748b" strokeWidth="1" opacity="0.2"/>
          </svg>
          
          {/* Tenement Points scattered across WA mining regions */}
          {/* Pilbara region (north) */}
          <div className="absolute top-20 left-32 w-3 h-3 bg-emerald-600 rounded-full shadow-sm animate-pulse"></div>
          <div className="absolute top-24 left-40 w-3 h-3 bg-emerald-600 rounded-full shadow-sm"></div>
          <div className="absolute top-28 left-48 w-3 h-3 bg-emerald-600 rounded-full shadow-sm animate-pulse"></div>
          <div className="absolute top-32 left-44 w-3 h-3 bg-emerald-600 rounded-full shadow-sm"></div>
          <div className="absolute top-36 left-52 w-3 h-3 bg-amber-600 rounded-full shadow-sm"></div>
          
          {/* Mid-west region */}
          <div className="absolute top-48 left-36 w-3 h-3 bg-emerald-600 rounded-full shadow-sm"></div>
          <div className="absolute top-52 left-44 w-3 h-3 bg-amber-600 rounded-full shadow-sm animate-pulse"></div>
          <div className="absolute top-56 left-40 w-3 h-3 bg-emerald-600 rounded-full shadow-sm"></div>
          <div className="absolute top-60 left-48 w-3 h-3 bg-red-600 rounded-full shadow-sm"></div>
          
          {/* Goldfields region */}
          <div className="absolute top-72 left-44 w-3 h-3 bg-emerald-600 rounded-full shadow-sm animate-pulse"></div>
          <div className="absolute top-76 left-52 w-3 h-3 bg-emerald-600 rounded-full shadow-sm"></div>
          <div className="absolute top-80 left-48 w-3 h-3 bg-amber-600 rounded-full shadow-sm"></div>
          <div className="absolute top-84 left-56 w-3 h-3 bg-emerald-600 rounded-full shadow-sm"></div>
          
          {/* Southern regions */}
          <div className="absolute top-96 left-40 w-3 h-3 bg-emerald-600 rounded-full shadow-sm"></div>
          <div className="absolute top-100 left-48 w-3 h-3 bg-amber-600 rounded-full shadow-sm animate-pulse"></div>
          <div className="absolute top-104 left-44 w-3 h-3 bg-emerald-600 rounded-full shadow-sm"></div>
        </div>
        
        {/* Overlay Content */}
        <div className="relative z-10 flex flex-col justify-center p-12">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Complete Tenement Management</h2>
            <p className="text-gray-700 text-lg mb-8">
              Streamline your mining operations with comprehensive tenement tracking, compliance monitoring, and automated workflows across Australia.
            </p>
            
            {/* Key Features */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Automated Compliance Tracking</h3>
                  <p className="text-xs text-gray-600">Never miss renewal dates or reporting requirements</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Multi-Jurisdiction Support</h3>
                  <p className="text-xs text-gray-600">Manage tenements across all Australian states</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Real-time Data Sync</h3>
                  <p className="text-xs text-gray-600">Always up-to-date with government databases</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tenement Popup Overlay */}
        <div className="absolute top-20 right-16 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-w-sm animate-fade-in">
          {/* Popup Header */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-gray-900 truncate">ML1865</h3>
                <p className="text-sm text-gray-600 mt-1 font-medium">Mining Lease</p>
              </div>
              <div className="ml-4 flex flex-col items-end space-y-2">
                <span className="px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                  LIVE
                </span>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  NSW
                </span>
              </div>
            </div>
          </div>

          {/* Popup Content */}
          <div className="px-6 py-4">
            <div className="space-y-3">
              {/* Holder Information */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Holder Information
                </h4>
                <p className="text-sm text-gray-900 font-medium">
                  WALKER QUARRIES PTY LTD
                </p>
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Area</p>
                  <p className="text-sm font-bold text-blue-900">21.88 ha</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Expires</p>
                  <p className="text-sm font-bold text-purple-900">27/10/2044</p>
                </div>
              </div>
            </div>
          </div>

          {/* Popup Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <button className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>View Full Record</span>
            </button>
          </div>
        </div>
        
        {/* Shire Rates Overlay */}
        <div className="absolute bottom-16 left-12 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-900">Shire Rates Due</h4>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 px-2 bg-red-50 rounded">
              <span className="text-red-700 font-medium">City of Kalgoorlie-Boulder</span>
              <span className="text-red-800 font-bold">$12,450</span>
            </div>
            <div className="flex justify-between items-center py-1 px-2 bg-amber-50 rounded">
              <span className="text-amber-700 font-medium">Shire of East Pilbara</span>
              <span className="text-amber-800 font-bold">$8,920</span>
            </div>
            <div className="flex justify-between items-center py-1 px-2 bg-orange-50 rounded">
              <span className="text-orange-700 font-medium">Shire of Ashburton</span>
              <span className="text-orange-800 font-bold">$5,680</span>
            </div>
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Total Outstanding:</span>
              <span className="text-sm font-bold text-gray-900">$27,050</span>
            </div>
          </div>
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-16 right-12 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">WA Tenements</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
              <span className="text-xs text-gray-700">Live (18,234)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
              <span className="text-xs text-gray-700">Pending (1,456)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span className="text-xs text-gray-700">Expired (843)</span>
            </div>
          </div>
        </div>
        
        {/* Trusted By Section */}
        <div className="absolute bottom-4 right-12">
          <p className="text-xs text-gray-500 mb-2">Trusted by teams at</p>
          <div className="flex items-center space-x-4 opacity-60">
            <div className="text-gray-600 font-semibold text-xs">HETHERINGTON</div>
            <div className="text-gray-600 font-semibold text-xs">MINING CORP</div>
          </div>
        </div>
      </div>
    </div>
  );
}
