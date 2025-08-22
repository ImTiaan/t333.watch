/**
 * Conversion Funnel Tracking
 * 
 * This module provides utilities for tracking user journey through the subscription conversion funnel.
 * It tracks users from landing page to subscription completion, including anonymous users.
 */

import { supabase } from '@/lib/supabase';

// Funnel step types matching the database schema
export type FunnelStep = 
  | 'landing_page'
  | 'view_pricing'
  | 'start_checkout'
  | 'payment_info'
  | 'complete_purchase'
  | 'abandoned_checkout';

interface FunnelEventData {
  session_id?: string;
  user_id?: string;
  funnel_step: FunnelStep;
  page_url?: string;
  referrer?: string;
  user_agent?: string;
  ip_address?: string;
  event_data?: Record<string, any>;
}

/**
 * Generate or retrieve session ID for tracking anonymous users
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('conversion_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('conversion_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Get client information for tracking
 */
function getClientInfo() {
  if (typeof window === 'undefined') {
    return {
      page_url: '',
      referrer: '',
      user_agent: ''
    };
  }
  
  return {
    page_url: window.location.href,
    referrer: document.referrer || '',
    user_agent: navigator.userAgent
  };
}

/**
 * Save funnel event to database
 */
async function saveFunnelEvent(eventData: FunnelEventData) {
  try {
    const { error } = await supabase
      .from('conversion_funnel_events')
      .insert({
        session_id: eventData.session_id,
        user_id: eventData.user_id,
        funnel_step: eventData.funnel_step,
        page_url: eventData.page_url,
        referrer: eventData.referrer,
        user_agent: eventData.user_agent,
        event_data: eventData.event_data || {}
      });
    
    if (error) {
      console.error('Error saving funnel event:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving funnel event:', error);
    return false;
  }
}

/**
 * Track landing page visit
 */
export async function trackLandingPage(
  userId?: string,
  metadata?: Record<string, any>
) {
  const sessionId = getSessionId();
  const clientInfo = getClientInfo();
  
  return await saveFunnelEvent({
    session_id: sessionId,
    user_id: userId,
    funnel_step: 'landing_page',
    ...clientInfo,
    event_data: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  });
}

/**
 * Track pricing page view
 */
export async function trackViewPricing(
  userId?: string,
  metadata?: Record<string, any>
) {
  const sessionId = getSessionId();
  const clientInfo = getClientInfo();
  
  return await saveFunnelEvent({
    session_id: sessionId,
    user_id: userId,
    funnel_step: 'view_pricing',
    ...clientInfo,
    event_data: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  });
}

/**
 * Track checkout start
 */
export async function trackFunnelCheckoutStart(
  userId: string,
  planId: string,
  planName: string,
  metadata?: Record<string, any>
) {
  const sessionId = getSessionId();
  const clientInfo = getClientInfo();
  
  return await saveFunnelEvent({
    session_id: sessionId,
    user_id: userId,
    funnel_step: 'start_checkout',
    ...clientInfo,
    event_data: {
      plan_id: planId,
      plan_name: planName,
      timestamp: new Date().toISOString(),
      ...metadata
    }
  });
}

/**
 * Track payment info entry
 */
export async function trackPaymentInfo(
  userId: string,
  planId: string,
  metadata?: Record<string, any>
) {
  const sessionId = getSessionId();
  const clientInfo = getClientInfo();
  
  return await saveFunnelEvent({
    session_id: sessionId,
    user_id: userId,
    funnel_step: 'payment_info',
    ...clientInfo,
    event_data: {
      plan_id: planId,
      timestamp: new Date().toISOString(),
      ...metadata
    }
  });
}

/**
 * Track purchase completion
 */
export async function trackCompletePurchase(
  userId: string,
  planId: string,
  planName: string,
  amount: number,
  metadata?: Record<string, any>
) {
  const sessionId = getSessionId();
  const clientInfo = getClientInfo();
  
  return await saveFunnelEvent({
    session_id: sessionId,
    user_id: userId,
    funnel_step: 'complete_purchase',
    ...clientInfo,
    event_data: {
      plan_id: planId,
      plan_name: planName,
      amount,
      timestamp: new Date().toISOString(),
      ...metadata
    }
  });
}

/**
 * Track checkout abandonment
 */
export async function trackAbandonedCheckout(
  userId?: string,
  planId?: string,
  step?: string,
  metadata?: Record<string, any>
) {
  const sessionId = getSessionId();
  const clientInfo = getClientInfo();
  
  return await saveFunnelEvent({
    session_id: sessionId,
    user_id: userId,
    funnel_step: 'abandoned_checkout',
    ...clientInfo,
    event_data: {
      plan_id: planId,
      abandonment_step: step,
      timestamp: new Date().toISOString(),
      ...metadata
    }
  });
}

/**
 * Get conversion funnel analytics for a date range
 */
export async function getFunnelAnalytics(
  startDate: string,
  endDate: string
) {
  try {
    const { data: events, error } = await supabase
      .from('conversion_funnel_events')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching funnel analytics:', error);
      return null;
    }
    
    // Calculate funnel metrics
    const funnelSteps = {
      landing_page: events?.filter(e => e.funnel_step === 'landing_page').length || 0,
      view_pricing: events?.filter(e => e.funnel_step === 'view_pricing').length || 0,
      start_checkout: events?.filter(e => e.funnel_step === 'start_checkout').length || 0,
      payment_info: events?.filter(e => e.funnel_step === 'payment_info').length || 0,
      complete_purchase: events?.filter(e => e.funnel_step === 'complete_purchase').length || 0,
      abandoned_checkout: events?.filter(e => e.funnel_step === 'abandoned_checkout').length || 0
    };
    
    // Calculate conversion rates
    const conversionRates = {
      landing_to_pricing: funnelSteps.landing_page > 0 ? 
        (funnelSteps.view_pricing / funnelSteps.landing_page) * 100 : 0,
      pricing_to_checkout: funnelSteps.view_pricing > 0 ? 
        (funnelSteps.start_checkout / funnelSteps.view_pricing) * 100 : 0,
      checkout_to_payment: funnelSteps.start_checkout > 0 ? 
        (funnelSteps.payment_info / funnelSteps.start_checkout) * 100 : 0,
      payment_to_purchase: funnelSteps.payment_info > 0 ? 
        (funnelSteps.complete_purchase / funnelSteps.payment_info) * 100 : 0,
      overall_conversion: funnelSteps.landing_page > 0 ? 
        (funnelSteps.complete_purchase / funnelSteps.landing_page) * 100 : 0
    };
    
    // Calculate abandonment rate
    const totalCheckoutAttempts = funnelSteps.start_checkout;
    const abandonmentRate = totalCheckoutAttempts > 0 ? 
      (funnelSteps.abandoned_checkout / totalCheckoutAttempts) * 100 : 0;
    
    return {
      funnelSteps,
      conversionRates,
      abandonmentRate,
      events: events || []
    };
  } catch (error) {
    console.error('Error calculating funnel analytics:', error);
    return null;
  }
}

/**
 * Get session journey for a specific session
 */
export async function getSessionJourney(sessionId: string) {
  try {
    const { data: events, error } = await supabase
      .from('conversion_funnel_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching session journey:', error);
      return null;
    }
    
    return events || [];
  } catch (error) {
    console.error('Error fetching session journey:', error);
    return null;
  }
}

/**
 * Clear session ID (useful for testing or when user explicitly starts new session)
 */
export function clearSessionId() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('conversion_session_id');
  }
}