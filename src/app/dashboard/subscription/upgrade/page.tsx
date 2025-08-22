'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { isPremium } from '@/lib/premium';
import { config } from '@/lib/config';
import { useConversionFunnel } from '@/hooks/useConversionFunnel';
import { useSubscriptionTracking } from '@/hooks/useSubscriptionTracking';

export default function UpgradePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { trackPricing, trackCheckoutStart } = useConversionFunnel();
  const { trackStartCheckout } = useSubscriptionTracking();
  
  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Redirect to subscription page if already premium
  useEffect(() => {
    if (!isLoading && user && isPremium(user)) {
      router.push('/dashboard/subscription');
    }
  }, [isLoading, user, router]);
  
  // Track pricing page view
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      trackPricing({
        source: 'upgrade_page',
        userType: isPremium(user) ? 'premium' : 'free'
      });
    }
  }, [isLoading, isAuthenticated, user, trackPricing]);
  
  const plans = {
    monthly: {
      price: config.subscription.price,
      billing: 'monthly',
      savings: null,
    },
    yearly: {
      price: config.subscription.price * 10, // 2 months free
      billing: 'yearly',
      savings: '17%',
    },
  };
  
  const features = [
    `Up to ${config.features.maxPremiumStreams} streams (free tier: ${config.features.maxFreeStreams})`,
    'Save and share Packs',
    'VOD synchronization',
    'Notifications for live Packs',
    'Priority support',
  ];
  
  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true);
      
      const currentPlan = plans[selectedPlan];
      const planId = `premium_${selectedPlan}`;
      const planName = `Premium ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`;
      
      // Track checkout start in both systems
      await trackCheckoutStart(planId, planName, currentPlan.price, {
        billing_interval: selectedPlan,
        source: 'upgrade_page'
      });
      
      await trackStartCheckout(planId, planName, currentPlan.price, {
        billing_interval: selectedPlan,
        source: 'upgrade_page'
      });
      
      // Call the API to create a Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { sessionUrl } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = sessionUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('There was an error starting the checkout process. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Upgrade to Premium</h1>
        <div className="animate-pulse bg-gray-800 h-40 rounded-lg"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Upgrade to Premium</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Choose a Plan</h2>
        
        {/* Plan selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            className={`p-6 rounded-lg border ${
              selectedPlan === 'monthly'
                ? 'border-[#9146FF] bg-[#9146FF]/10'
                : 'border-[#2d2d3a] hover:border-[#9146FF]/50'
            }`}
            onClick={() => setSelectedPlan('monthly')}
          >
            <div className="text-2xl font-bold text-white mb-1">${plans.monthly.price.toFixed(2)}</div>
            <div className="text-gray-400">Billed monthly</div>
          </button>
          
          <button
            className={`p-6 rounded-lg border ${
              selectedPlan === 'yearly'
                ? 'border-[#9146FF] bg-[#9146FF]/10'
                : 'border-[#2d2d3a] hover:border-[#9146FF]/50'
            }`}
            onClick={() => setSelectedPlan('yearly')}
          >
            <div className="text-2xl font-bold text-white mb-1">
              ${plans.yearly.price.toFixed(2)}
              <span className="block text-sm font-normal text-[#9146FF]">Save {plans.yearly.savings}</span>
            </div>
            <div className="text-gray-400">Billed yearly</div>
          </button>
        </div>
        
        {/* Features */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Premium Features</h3>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#9146FF] mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Checkout button */}
        <button
          onClick={handleCheckout}
          disabled={isCheckingOut}
          className="w-full py-3 bg-[#9146FF] hover:bg-[#7a3dd3] text-white font-bold rounded transition-colors disabled:opacity-50"
        >
          {isCheckingOut ? 'Processing...' : 'Upgrade Now'}
        </button>
        
        <p className="text-center text-gray-400 text-sm mt-4">
          You can cancel your subscription at any time.
        </p>
      </div>
    </div>
  );
}