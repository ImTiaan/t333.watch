'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { config } from '@/lib/config';
import { createUser, getUser } from '@/lib/supabase';
import { twitchApi } from '@/lib/twitch-api';
import Cookies from 'js-cookie';

// Loading component to display while the callback is processing
function CallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e0e10]">
      <div className="bg-[#18181b] p-8 rounded-lg border border-[#2d2d3a] max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Logging you in...</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9146FF]"></div>
        </div>
      </div>
    </div>
  );
}

// Callback component that uses searchParams
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code and state from the URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        // Check if there's an error
        if (errorParam) {
          throw new Error(`Authentication error: ${errorParam}`);
        }

        // Check if code exists
        if (!code) {
          throw new Error('No authorization code provided');
        }

        // Verify state to prevent CSRF attacks
        const savedState = localStorage.getItem('twitch_auth_state');
        if (state !== savedState) {
          throw new Error('Invalid state parameter');
        }

        // Clean up the state
        localStorage.removeItem('twitch_auth_state');

        // Exchange the code for an access token
        const tokenResponse = await fetch('/api/auth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          throw new Error(`Token exchange failed: ${errorData.message}`);
        }

        const tokenData = await tokenResponse.json();
        const { access_token, expires_in } = tokenData;

        console.log('Successfully obtained access token');
        
        // Store the token in localStorage
        localStorage.setItem('twitch_access_token', access_token);
        
        // Also store the token in a cookie for server-side access
        Cookies.set('twitch_access_token', access_token, {
          expires: 7, // 7 days
          path: '/',
          sameSite: 'Lax'
        });

        // Set the token in the Twitch API client
        twitchApi.setAccessToken(access_token);
        
        try {
          // Verify the token works by getting user info
          const userInfo = await twitchApi.getUser();
          console.log('Successfully verified token with user:', userInfo.display_name);
        } catch (verifyError) {
          console.error('Token verification failed:', verifyError);
          // Continue anyway, the AuthProvider will handle this
        }

        // We'll handle user creation in the AuthProvider component instead
        // This avoids potential errors during the callback process

        // Force a hard redirect to ensure the auth state is refreshed
        console.log('Redirecting to dashboard...');
        window.location.href = '/dashboard';
      } catch (err) {
        console.error('Authentication callback error:', err);
        setError(err instanceof Error ? err.message : 'Unknown authentication error');
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e0e10]">
        <div className="bg-[#18181b] p-8 rounded-lg border border-[#2d2d3a] max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Error</h1>
          <p className="text-red-500 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="twitch-button w-full"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e0e10]">
      <div className="bg-[#18181b] p-8 rounded-lg border border-[#2d2d3a] max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Logging you in...</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9146FF]"></div>
        </div>
      </div>
    </div>
  );
}

// Main export component that wraps CallbackContent in a Suspense boundary
export default function AuthCallback() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <CallbackContent />
    </Suspense>
  );
}