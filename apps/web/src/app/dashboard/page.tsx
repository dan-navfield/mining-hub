'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Map, Users, FileText, Settings, BarChart3, Shield, Building } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getUserTypeIcon = () => {
    switch (profile?.userType) {
      case 'platform_admin':
        return <Shield className="w-6 h-6 text-purple-600" />;
      case 'business_user':
        return <Building className="w-6 h-6 text-blue-600" />;
      case 'client':
        return <Users className="w-6 h-6 text-emerald-600" />;
      default:
        return <Users className="w-6 h-6 text-gray-600" />;
    }
  };

  const getUserTypeColor = () => {
    switch (profile?.userType) {
      case 'platform_admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'business_user':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'client':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getUserTypeLabel = () => {
    switch (profile?.userType) {
      case 'platform_admin':
        return 'Platform Admin';
      case 'business_user':
        return 'Business User';
      case 'client':
        return 'Client';
      default:
        return 'User';
    }
  };

  const quickActions = [
    {
      title: 'View Map',
      description: 'Explore tenements on the interactive map',
      icon: <Map className="w-8 h-8 text-emerald-600" />,
      href: '/map',
      color: 'bg-emerald-50 hover:bg-emerald-100'
    },
    {
      title: 'Browse Tenements',
      description: 'Search and filter all tenements',
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      href: '/tenements/all',
      color: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      title: 'Analytics',
      description: 'View reports and insights',
      icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
      href: '/analytics',
      color: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      title: 'Settings',
      description: 'Manage your account and preferences',
      icon: <Settings className="w-8 h-8 text-gray-600" />,
      href: '/settings',
      color: 'bg-gray-50 hover:bg-gray-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back{profile?.firstName ? `, ${profile.firstName}` : ''}!
              </h2>
              <p className="text-gray-600">
                {profile?.company && `${profile.company} • `}
                {profile?.email}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getUserTypeColor()}`}>
              <div className="flex items-center space-x-2">
                {getUserTypeIcon()}
                <span>{getUserTypeLabel()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Verification Banner */}
        {!profile?.emailVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  Please verify your email address to access all features.{' '}
                  <Link href="/auth/verify-email" className="font-medium underline hover:text-amber-800">
                    Resend verification email
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className={`${action.color} rounded-xl p-6 border border-gray-200 transition-all duration-200 hover:shadow-md hover:scale-105`}
            >
              <div className="flex flex-col items-start space-y-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  {action.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No recent activity to display</p>
            <p className="text-sm text-gray-400 mt-1">
              Start exploring tenements to see your activity here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
