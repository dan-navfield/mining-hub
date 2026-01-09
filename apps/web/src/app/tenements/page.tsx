'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TenementsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new comprehensive tenements page
    router.replace('/tenements/all');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to comprehensive tenements view...</p>
      </div>
    </div>
  );
}
