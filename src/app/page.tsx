'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function Home() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div>
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Watch Multiple Twitch Streams <span className="text-[#9146FF]">Simultaneously</span>
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mb-10">
          t333.watch is what happens when Twitch gets superpowers. It feels native, but lets you watch multiple perspectives — live or in sync — with Packs you can save, share, and discover.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={login} className="twitch-button text-lg px-8 py-3">
            Get Started
          </button>
          <Link href="/about" className="twitch-button-secondary text-lg px-8 py-3">
            Learn More
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-[#18181b] p-6 rounded-lg border border-[#2d2d3a]">
            <div className="bg-[#9146FF] w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-center">Multi-Stream Viewer</h3>
            <p className="text-gray-400 text-center">
              Watch up to 3 streams for free, or upgrade to premium for unlimited streams.
            </p>
          </div>
          <div className="bg-[#18181b] p-6 rounded-lg border border-[#2d2d3a]">
            <div className="bg-[#9146FF] w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-center">Stream Packs</h3>
            <p className="text-gray-400 text-center">
              Create, save, and share collections of streams with your audience.
            </p>
          </div>
          <div className="bg-[#18181b] p-6 rounded-lg border border-[#2d2d3a]">
            <div className="bg-[#9146FF] w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-center">VOD Sync</h3>
            <p className="text-gray-400 text-center">
              Synchronize VODs for perfect multi-perspective playback of past events.
            </p>
          </div>
        </div>
      </div>

      {/* About section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-[#18181b] rounded-lg p-6 border border-[#2d2d3a]">
          <h2 className="text-xl font-bold mb-4">About t333.watch</h2>
          <p className="text-gray-300 mb-4">
            t333.watch is a platform for watching multiple Twitch streams simultaneously.
            Create and share packs of your favorite streamers, or discover packs created by others.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-[#0e0e10] p-4 rounded-lg">
              <h3 className="font-bold mb-2">Watch Together</h3>
              <p className="text-gray-400 text-sm">
                View multiple streams at once, with synchronized audio control.
              </p>
            </div>
            <div className="bg-[#0e0e10] p-4 rounded-lg">
              <h3 className="font-bold mb-2">Create & Share</h3>
              <p className="text-gray-400 text-sm">
                Build your own packs and share them with friends or the community.
              </p>
            </div>
            <div className="bg-[#0e0e10] p-4 rounded-lg">
              <h3 className="font-bold mb-2">Discover New Content</h3>
              <p className="text-gray-400 text-sm">
                Find new streamers and perspectives through curated packs.
              </p>
            </div>
          </div>
          
          {!isAuthenticated && (
            <div className="mt-8 text-center">
              <button onClick={login} className="twitch-button">
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
