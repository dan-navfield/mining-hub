'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export type UserType = 'platform_admin' | 'business_user' | 'client';

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  company?: string;
  userType?: UserType;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  lastSignIn?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
  isBusinessUser: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  
  // Memoize supabase client to prevent re-creation on every render
  // Handle missing env vars gracefully during build time
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      // Return a mock client during build time
      return null as any;
    }
    
    return createBrowserClient(url, key);
  }, []);
  const router = useRouter();

  const createUserProfile = (user: User): UserProfile => {
    const metadata = user.user_metadata || {};
    const appMetadata = user.app_metadata || {};
    
    return {
      id: user.id,
      email: user.email || '',
      firstName: metadata.first_name || metadata.firstName || '',
      lastName: metadata.last_name || metadata.lastName || '',
      fullName: metadata.full_name || metadata.fullName || `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim(),
      company: metadata.company || '',
      userType: metadata.user_type || appMetadata.user_type || 'client',
      avatarUrl: metadata.avatar_url || metadata.picture || '',
      emailVerified: user.email_confirmed_at !== null,
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at || undefined
    };
  };

  const refreshProfile = async () => {
    if (!supabase) return;
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const userProfile = createUserProfile(currentUser);
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!supabase) throw new Error('Supabase client not available');
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: updates.firstName,
          last_name: updates.lastName,
          full_name: updates.fullName,
          company: updates.company,
          user_type: updates.userType
        }
      });

      if (error) {
        throw error;
      }

      // Update local profile state
      if (profile) {
        setProfile({ ...profile, ...updates });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!supabase) {
      router.push('/auth/login');
      return;
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      setUser(null);
      setProfile(null);
      setSession(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Skip if supabase client isn't available (build time)
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          setProfile(createUserProfile(initialSession.user));
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, currentSession: any) => {
        // Auth state changed
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          setProfile(createUserProfile(currentSession.user));
        } else {
          setProfile(null);
        }

        // Handle specific auth events (prevent redirect loops)
        switch (event) {
          case 'SIGNED_IN':
            if (!hasRedirected && typeof window !== 'undefined') {
              setHasRedirected(true);
              // Redirect to dashboard or intended page
              const redirectTo = sessionStorage.getItem('redirectAfterLogin');
              if (redirectTo) {
                sessionStorage.removeItem('redirectAfterLogin');
                router.push(redirectTo);
              } else if (window.location.pathname.startsWith('/auth/')) {
                router.push('/dashboard');
              }
            }
            break;
          
          case 'SIGNED_OUT':
            setHasRedirected(false);
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
              router.push('/auth/login');
            }
            break;
          
          case 'TOKEN_REFRESHED':
            // Token refreshed - no action needed
            break;
          
          case 'USER_UPDATED':
            // User updated - no action needed
            break;
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]); // Remove router from dependencies to prevent re-renders

  // Computed properties for user type checks
  const isAdmin = profile?.userType === 'platform_admin';
  const isBusinessUser = profile?.userType === 'business_user';
  const isClient = profile?.userType === 'client';

  // Memoize the context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    signOut,
    refreshProfile,
    updateProfile,
    isAdmin,
    isBusinessUser,
    isClient
  }), [user, profile, session, loading, isAdmin, isBusinessUser, isClient]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
