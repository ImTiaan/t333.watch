'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import CreatePackButton from '@/components/packs/CreatePackButton';
import PackCard from '@/components/packs/PackCard';
import { isPremium } from '@/lib/premium';
import { useConversionFunnel } from '@/hooks/useConversionFunnel';

// Define the Pack type
interface Stream {
  id: string;
  twitch_channel: string;
  order: number;
  offset_seconds: number;
}

interface Pack {
  id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  visibility: 'public' | 'private';
  owner_id: string;
  created_at: string;
  updated_at: string;
  pack_streams: Stream[];
}

export default function Dashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [isLoadingPacks, setIsLoadingPacks] = useState(false);
  const { trackLanding } = useConversionFunnel();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Track landing page visit
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      trackLanding({
        source: 'dashboard',
        userType: isPremium(user) ? 'premium' : 'free',
        referrer: document.referrer || 'direct'
      });
    }
  }, [isLoading, isAuthenticated, user, trackLanding]);

  // Fetch user's packs
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchPacks = async () => {
        setIsLoadingPacks(true);
        try {
          const response = await fetch('/api/packs', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies in the request
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API response error:', response.status, errorData);
            throw new Error(`Failed to fetch packs: ${response.status}`);
          }
          const data = await response.json();
          setPacks(data.packs || []);
        } catch (error) {
          console.error('Error fetching packs:', error);
        } finally {
          setIsLoadingPacks(false);
        }
      };

      fetchPacks();
    }
  }, [isAuthenticated, user]);

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
      <h1 className="text-3xl font-bold mb-6">Welcome, {user?.display_name}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quick Actions */}
        <div className="bg-[#18181b] p-6 rounded-lg border border-[#2d2d3a]">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-3">
            <Link href="/viewer" className="twitch-button text-center">
              Create New Viewer
            </Link>
            <CreatePackButton className="twitch-button-secondary text-center w-full" />
          </div>
        </div>
        
        {/* Subscription Status */}
        <div className="bg-[#18181b] p-6 rounded-lg border border-[#2d2d3a]">
          <h2 className="text-xl font-bold mb-4">Subscription</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isPremium(user) ? 'bg-green-900 text-green-100' : 'bg-gray-700 text-gray-300'
              }`}>
                {isPremium(user) ? 'Premium' : 'Free'}
              </span>
            </div>
            <Link
              href="/dashboard/subscription"
              className={`${isPremium(user) ? 'twitch-button-secondary' : 'twitch-button'} text-center`}
            >
              {isPremium(user) ? 'Manage Subscription' : 'Upgrade to Premium'}
            </Link>
          </div>
        </div>
        
        {/* Recent Packs */}
        <div className="bg-[#18181b] p-6 rounded-lg border border-[#2d2d3a]">
          <h2 className="text-xl font-bold mb-4">Your Recent Packs</h2>
          
          {isLoadingPacks ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9146FF]"></div>
            </div>
          ) : packs.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              You haven't created any packs yet.
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              {packs.slice(0, 3).map((pack) => (
                <div key={pack.id} className="bg-[#0e0e10] p-3 rounded border border-[#2d2d3a] hover:border-[#9146FF] transition-colors">
                  <Link href={`/dashboard/packs/${pack.id}`} className="block">
                    <h3 className="font-medium text-white">{pack.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 truncate">
                      {pack.description || 'No description'}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {pack.pack_streams?.length || 0} streams
                      </span>
                      <span className="text-xs text-gray-500">
                        {pack.visibility}
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 text-center">
            <Link href="/dashboard/packs" className="text-[#9146FF] hover:underline">
              View all your packs
            </Link>
          </div>
        </div>
        
        {/* Trending Packs */}
        <div className="bg-[#18181b] p-6 rounded-lg border border-[#2d2d3a] lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Trending Packs</h2>
          <div className="text-gray-400 text-center py-8">
            No trending packs available.
          </div>
          <div className="mt-4 text-center">
            <Link href="/discover" className="text-[#9146FF] hover:underline">
              Discover more packs
            </Link>
          </div>
        </div>
      </div>
      
      {/* Followed Streams */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Followed Streams</h2>
        <div className="bg-[#18181b] p-6 rounded-lg border border-[#2d2d3a]">
          <div className="text-gray-400 text-center py-8">
            Loading followed streams...
          </div>
        </div>
      </div>
    </div>
  );
}