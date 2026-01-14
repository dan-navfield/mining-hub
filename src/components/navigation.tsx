'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Building2, 
  CheckSquare, 
  FileText, 
  Settings, 
  User,
  LogOut,
  Cog,
  Receipt,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { 
  Button
} from '@mining-hub/ui';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@mining-hub/ui';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Building2 },
  { name: 'Tenements', href: '/tenements/all', icon: Building2 },
  { name: 'Map', href: '/map', icon: MapPin },
  { name: 'Actions', href: '/actions', icon: CheckSquare },
  { name: 'Holders', href: '/holders', icon: Building2 },
  { name: 'Shire Rates', href: '/shire-rates', icon: Receipt },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Admin', href: '/admin', icon: Settings, adminOnly: true },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Memoize filtered navigation to prevent recalculation on every render
  const filteredNavigation = useMemo(() => {
    return navigation.filter(
      item => !item.adminOnly || profile?.userType === 'platform_admin'
    );
  }, [profile?.userType]);

  if (!user) {
    // Return a fallback navigation when no user with original styling
    return (
      <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">HetheTrack</h1>
                  <p className="text-xs text-gray-500 font-medium">Mining Management</p>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-8 ml-8">
                <a href="/dashboard" className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl transition-all duration-200 hover:bg-emerald-100">
                  Dashboard
                </a>
                <a href="/tenements/all" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors duration-200">
                  Tenements
                </a>
                <a href="/map" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors duration-200">
                  Map
                </a>
                <a href="/actions" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors duration-200">
                  Actions
                </a>
                <a href="/holders" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors duration-200">
                  Holders
                </a>
                <a href="/shire-rates" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors duration-200">
                  Shire Rates
                </a>
                <a href="/reports" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors duration-200">
                  Reports
                </a>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/data-sources">
                <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors duration-200" title="Data Source Settings">
                  <Cog className="w-5 h-5" />
                </button>
              </Link>
              
              <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors duration-200 relative">
                <div className="w-5 h-5">🔔</div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-400 to-red-600 rounded-full animate-pulse"></div>
              </button>
              
              <Link href="/auth/login">
                <div className="flex items-center space-x-3 bg-gray-50 rounded-2xl p-2 hover:bg-gray-100 transition-colors duration-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white font-semibold text-sm">?</span>
                  </div>
                  <div className="hidden md:block pr-2">
                    <p className="text-sm font-semibold text-gray-900">Sign In</p>
                    <p className="text-xs text-gray-500">Guest User</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // filteredNavigation is now memoized above

  return (
    <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">HetheTrack</h1>
                <p className="text-xs text-gray-500 font-medium">Mining Management</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8 ml-8">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={
                      isActive
                        ? "text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl transition-all duration-200 hover:bg-emerald-100"
                        : "text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors duration-200"
                    }
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/data-sources">
              <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors duration-200" title="Data Source Settings">
                <Cog className="w-5 h-5" />
              </button>
            </Link>
            
            <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors duration-200 relative">
              <div className="w-5 h-5">🔔</div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-400 to-red-600 rounded-full animate-pulse"></div>
            </button>
            
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-3 bg-gray-50 rounded-2xl p-2 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold text-sm">
                    {profile?.firstName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block pr-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {profile?.fullName || profile?.firstName || user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {profile?.userType === 'platform_admin' ? 'Admin' : 
                     profile?.userType === 'business_user' ? 'Business User' : 
                     profile?.userType === 'client' ? 'Client' : 'User'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200/50 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {profile?.fullName || profile?.firstName || user.email}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      {profile?.userType === 'platform_admin' ? 'Platform Admin' : 
                       profile?.userType === 'business_user' ? 'Business User' : 
                       profile?.userType === 'client' ? 'Client' : 'User'}
                    </p>
                  </div>
                  
                  <div className="py-1">
                    <Link 
                      href="/profile" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4 mr-3 text-gray-400" />
                      Profile Settings
                    </Link>
                    
                    <button 
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4 mr-3 text-red-400" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
