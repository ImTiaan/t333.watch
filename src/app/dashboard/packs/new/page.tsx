'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import PackForm from '@/components/packs/PackForm';

export default function NewPackPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e0e10]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9146FF]"></div>
      </div>
    );
  }
  
  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <Link href="/dashboard/packs" className="text-[#9146FF] hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to My Packs
        </Link>
      </div>
      
      <div className="bg-[#18181b] rounded-lg p-6 border border-[#2d2d3a]">
        <h1 className="text-2xl font-bold mb-6">Create New Pack</h1>
        
        <PackForm />
      </div>
      
      <div className="mt-8 bg-[#18181b] rounded-lg p-6 border border-[#2d2d3a]">
        <h2 className="text-xl font-bold mb-4">Tips for Creating Great Packs</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-[#9146FF]">Choose a Clear Title</h3>
            <p className="text-gray-300">
              Use a descriptive title that clearly indicates what viewers can expect.
              For example, &quot;NoPixel Heist - Multiple POVs&quot; or &quot;Valorant Tournament Finals&quot;.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-[#9146FF]">Add Relevant Tags</h3>
            <p className="text-gray-300">
              Tags help others discover your pack. Include game names, event names, or content types.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-[#9146FF]">Include Multiple Perspectives</h3>
            <p className="text-gray-300">
              The best packs include different viewpoints of the same event or game.
              Try to include complementary streams that enhance the viewing experience.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-[#9146FF]">Consider Visibility</h3>
            <p className="text-gray-300">
              Public packs can be discovered by other users, while private packs are only visible to you.
              Choose public for packs you want to share with the community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}