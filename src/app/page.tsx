'use client';

import dynamic from 'next/dynamic';

const HomePageClient = dynamic(() => import('@/App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#2EE9A8] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return <HomePageClient />;
}
