'use client';

import { useState } from 'react';
import { config } from '@/lib/config';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  if (!isOpen) return null;

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
    'Unlimited streams (up to 9 recommended)',
    'Save and share Packs',
    'VOD synchronization',
    'Notifications for live Packs',
    'Priority support',
  ];

  const handleCheckout = async () => {
    try {
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
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#18181b] rounded-lg max-w-md w-full overflow-hidden relative mx-auto">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-[#9146FF] p-6 text-center">
          <h2 className="text-2xl font-bold text-white">Upgrade to Premium</h2>
          <p className="text-white/80">Unlock the full potential of t333.watch</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Plan selection */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              className={`p-4 rounded border ${
                selectedPlan === 'monthly'
                  ? 'border-[#9146FF] bg-[#9146FF]/10'
                  : 'border-[#2d2d3a] hover:border-[#9146FF]/50'
              }`}
              onClick={() => setSelectedPlan('monthly')}
            >
              <div className="text-xl font-bold text-white">${plans.monthly.price.toFixed(2)}</div>
              <div className="text-gray-400">Billed monthly</div>
            </button>
            <button
              className={`p-4 rounded border ${
                selectedPlan === 'yearly'
                  ? 'border-[#9146FF] bg-[#9146FF]/10'
                  : 'border-[#2d2d3a] hover:border-[#9146FF]/50'
              }`}
              onClick={() => setSelectedPlan('yearly')}
            >
              <div className="text-xl font-bold text-white">
                ${plans.yearly.price.toFixed(2)}
                <span className="block text-sm font-normal text-[#9146FF]">Save {plans.yearly.savings}</span>
              </div>
              <div className="text-gray-400">Billed yearly</div>
            </button>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Premium Features</h3>
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
            className="w-full py-3 bg-[#9146FF] hover:bg-[#7a3dd3] text-white font-bold rounded transition-colors"
          >
            Upgrade Now
          </button>

          <p className="text-center text-gray-400 text-sm mt-4">
            You can cancel your subscription at any time.
          </p>
        </div>
      </div>
    </div>
  );
}