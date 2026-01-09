'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from './navigation';

export function ConditionalNavigation() {
  const pathname = usePathname();
  
  // Don't show navigation on auth pages or old login page
  const isAuthPage = pathname.startsWith('/auth/') || pathname === '/login';
  
  if (isAuthPage) {
    return null;
  }
  
  return <Navigation />;
}
