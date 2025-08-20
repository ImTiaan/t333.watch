'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { isPremium, getPremiumFeatures } from '@/lib/premium';
import { config } from '@/lib/config';
import CancellationModal from '@/components/subscription/CancellationModal';

interface SubscriptionHistory {
  subscriptions: Array<{
    id: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    created: number;
    canceled_at: number | null;
    ended_at: number | null;
    plan: {
      id: string;
      amount: number;
      currency: string;
      interval: string;
      product: string;
    };
    payment_method: {
      id: string;
      type: string;
      card: {
        brand: string;
        last4: string;
        exp_month: number;
        exp_year: number;
      } | null;
    } | null;
  }>;
  invoices: Array<{
    id: string;
    number: string;
    status: string;
    amount_paid: number;
    amount_due: number;
    currency: string;
    created: number;
    period_start: number;
    period_end: number;
    hosted_invoice_url: string;
    invoice_pdf: string;
    subscription_id: string;
    payment_intent: {
      id: string;
      status: string;
    } | null;
  }>;
  paymentMethods: Array<{
    id: string;
    type: string;
    card: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    } | null;
    created: number;
  }>;
}

export default function SubscriptionPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isCreatingPortal, setIsCreatingPortal] = useState(false);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'billing'>('overview');
  const [isModifyingSubscription, setIsModifyingSubscription] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Load subscription history
  useEffect(() => {
    if (isAuthenticated && user && activeTab !== 'overview') {
      loadSubscriptionHistory();
    }
  }, [isAuthenticated, user, activeTab]);

  const loadSubscriptionHistory = async () => {
    if (isLoadingHistory) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/stripe/subscription-history');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionHistory(data);
      }
    } catch (error) {
      console.error('Error loading subscription history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Get premium status and features
  const hasPremium = isPremium(user);
  const premiumFeatures = getPremiumFeatures(user);
  
  // Handle subscription management
  const handleManageSubscription = async () => {
    try {
      setIsCreatingPortal(true);
      
      // Call the API to create a Stripe customer portal session
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }
      
      const { url } = await response.json();
      
      // Redirect to the portal
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      alert('There was an error opening the subscription management portal. Please try again.');
    } finally {
      setIsCreatingPortal(false);
    }
  };

  const handlePlanChange = async (newPlan: 'monthly' | 'yearly') => {
    if (!user?.premium_flag) return;
    
    setIsModifyingSubscription(true);
    try {
      const response = await fetch('/api/stripe/modify-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: newPlan }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'Subscription updated successfully!');
        // Refresh the page to show updated subscription info
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription. Please try again.');
    } finally {
      setIsModifyingSubscription(false);
    }
  };

  const handleCancelSubscription = async (data: { reason: string; feedback: string; immediate: boolean }) => {
    setIsCancelling(true);
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || 'Subscription cancelled successfully.');
        setShowCancellationModal(false);
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('An error occurred while cancelling your subscription. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };
  
  // Handle new subscription
  const handleSubscribe = () => {
    router.push('/dashboard/subscription/upgrade');
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Subscription</h1>
        <div className="animate-pulse bg-gray-800 h-40 rounded-lg"></div>
      </div>
    );
  }
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
        return 'bg-green-900 text-green-100';
      case 'canceled':
      case 'past_due':
        return 'bg-red-900 text-red-100';
      case 'incomplete':
      case 'incomplete_expired':
        return 'bg-yellow-900 text-yellow-100';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Subscription</h1>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-[#9146FF] text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-[#9146FF] text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'billing'
              ? 'bg-[#9146FF] text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Billing
        </button>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Subscription Status */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Status</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            hasPremium ? 'bg-green-900 text-green-100' : 'bg-gray-700 text-gray-300'
          }`}>
            {hasPremium ? 'Premium' : 'Free'}
          </div>
        </div>
        
        {hasPremium ? (
            <div>
              <p className="text-gray-300 mb-4">
                You have access to all premium features. Thank you for supporting t333.watch!
              </p>
              <div className="flex space-x-3 mb-4">
                <button
                  onClick={handleManageSubscription}
                  disabled={isCreatingPortal}
                  className="px-4 py-2 bg-[#9146FF] hover:bg-[#7a3dd3] text-white font-medium rounded transition-colors disabled:opacity-50"
                >
                  {isCreatingPortal ? 'Loading...' : 'Manage Subscription'}
                </button>
              </div>
              
              {/* Plan Change Options */}
              <div className="bg-gray-700 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-medium mb-3">Change Plan</h3>
                <p className="text-gray-400 mb-4 text-sm">
                  Switch between monthly and yearly billing. Changes will be reflected in your next billing cycle.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handlePlanChange('monthly')}
                    disabled={isModifyingSubscription}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isModifyingSubscription ? 'Updating...' : 'Switch to Monthly'}
                  </button>
                  <button
                    onClick={() => handlePlanChange('yearly')}
                    disabled={isModifyingSubscription}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isModifyingSubscription ? 'Updating...' : 'Switch to Yearly'}
                  </button>
                </div>
              </div>
              
              {/* Cancel Subscription */}
              <div className="bg-gray-700 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-medium mb-3">Cancel Subscription</h3>
                <p className="text-gray-400 mb-4 text-sm">
                  Need to cancel your subscription? We&apos;re sorry to see you go.
                </p>
                <button
                  onClick={() => setShowCancellationModal(true)}
                  className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
          ) : (
          <div>
            <p className="text-gray-300 mb-4">
              You are currently on the free plan. Upgrade to premium to unlock all features.
            </p>
            <button
              onClick={handleSubscribe}
              className="px-4 py-2 bg-[#9146FF] hover:bg-[#7a3dd3] text-white font-medium rounded transition-colors"
            >
              Upgrade to Premium
            </button>
          </div>
        )}
      </div>
      
      {/* Features Comparison */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Free</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Up to {config.features.maxFreeStreams} streams
              </li>
              <li className="flex items-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                View public Packs
              </li>
              <li className="flex items-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Save and share Packs
              </li>
              <li className="flex items-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                VOD synchronization
              </li>
              <li className="flex items-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Notifications
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Premium</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Up to {config.features.maxPremiumStreams} streams
              </li>
              <li className="flex items-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                View public Packs
              </li>
              <li className="flex items-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Save and share Packs
              </li>
              <li className="flex items-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                VOD synchronization
              </li>
              <li className="flex items-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Notifications
              </li>
            </ul>
          </div>
        </div>
      </div>
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {isLoadingHistory ? (
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146FF] mx-auto"></div>
              <p className="mt-2 text-gray-400">Loading subscription history...</p>
            </div>
          ) : subscriptionHistory ? (
            <>
              {/* Subscriptions */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Subscriptions</h2>
                {subscriptionHistory.subscriptions.length > 0 ? (
                  <div className="space-y-4">
                    {subscriptionHistory.subscriptions.map((sub) => (
                      <div key={sub.id} className="border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{sub.plan.product}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                            {sub.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                          <div>
                            <p>Amount: {formatCurrency(sub.plan.amount, sub.plan.currency)}/{sub.plan.interval}</p>
                            <p>Created: {formatDate(sub.created)}</p>
                          </div>
                          <div>
                            <p>Current Period: {formatDate(sub.current_period_start)} - {formatDate(sub.current_period_end)}</p>
                            {sub.canceled_at && <p>Canceled: {formatDate(sub.canceled_at)}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No subscriptions found.</p>
                )}
              </div>

              {/* Invoices */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Invoices</h2>
                {subscriptionHistory.invoices.length > 0 ? (
                  <div className="space-y-4">
                    {subscriptionHistory.invoices.map((invoice) => (
                      <div key={invoice.id} className="border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Invoice #{invoice.number}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 mb-3">
                          <div>
                            <p>Amount: {formatCurrency(invoice.amount_paid, invoice.currency)}</p>
                            <p>Date: {formatDate(invoice.created)}</p>
                          </div>
                          <div>
                            <p>Period: {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}</p>
                            {invoice.payment_intent && (
                              <p>Payment: {invoice.payment_intent.status}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <a
                            href={invoice.hosted_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-[#9146FF] text-white rounded text-sm hover:bg-[#7c3aed] transition-colors"
                          >
                            View Invoice
                          </a>
                          <a
                            href={invoice.invoice_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                          >
                            Download PDF
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No invoices found.</p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-400">Unable to load subscription history.</p>
            </div>
          )}
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {isLoadingHistory ? (
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146FF] mx-auto"></div>
              <p className="mt-2 text-gray-400">Loading billing information...</p>
            </div>
          ) : subscriptionHistory ? (
            <>
              {/* Payment Methods */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
                {subscriptionHistory.paymentMethods.length > 0 ? (
                  <div className="space-y-4">
                    {subscriptionHistory.paymentMethods.map((method) => (
                      <div key={method.id} className="border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                              {method.card ? (
                                <span className="text-xs font-bold">{method.card.brand.toUpperCase()}</span>
                              ) : (
                                <span className="text-xs">{method.type.toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              {method.card ? (
                                <>
                                  <p className="font-medium">•••• •••• •••• {method.card.last4}</p>
                                  <p className="text-sm text-gray-400">Expires {method.card.exp_month}/{method.card.exp_year}</p>
                                </>
                              ) : (
                                <p className="font-medium">{method.type}</p>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-400">Added {formatDate(method.created)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No payment methods found.</p>
                )}
              </div>

              {/* Billing Actions */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Billing Management</h2>
                <p className="text-gray-400 mb-4">
                  Manage your payment methods, update billing information, and download receipts through the Stripe Customer Portal.
                </p>
                <button
                  onClick={handleManageSubscription}
                  disabled={isCreatingPortal}
                  className="px-4 py-2 bg-[#9146FF] text-white rounded hover:bg-[#7c3aed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingPortal ? 'Opening Portal...' : 'Manage Billing'}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-400">Unable to load billing information.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Cancellation Modal */}
      <CancellationModal
        isOpen={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        onConfirm={handleCancelSubscription}
        isLoading={isCancelling}
      />
    </div>
  );
}