/**
 * Subscription Analytics Service
 * 
 * This service handles saving subscription and payment events to the database
 * for analytics and reporting purposes.
 */

import { supabase } from './supabase';

export interface SubscriptionEventData {
  user_id: string;
  event_type: 'subscription_created' | 'subscription_cancelled' | 'subscription_upgraded' | 'subscription_downgraded';
  plan_id?: string;
  plan_name?: string;
  previous_plan_id?: string;
  previous_plan_name?: string;
  metadata?: Record<string, any>;
}

export interface PaymentEventData {
  user_id: string;
  event_type: 'payment_succeeded' | 'payment_failed' | 'payment_refunded';
  amount?: number; // in cents
  currency?: string;
  plan_id?: string;
  plan_name?: string;
  stripe_payment_intent_id?: string;
  stripe_subscription_id?: string;
  error_code?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface ConversionEventData {
  user_id?: string;
  event_type: 'view_plans' | 'start_checkout' | 'complete_checkout' | 'abandon_checkout';
  plan_id?: string;
  plan_name?: string;
  session_id?: string;
  referrer?: string;
  metadata?: Record<string, any>;
}

/**
 * Save a subscription event to the database
 */
export async function saveSubscriptionEvent(eventData: SubscriptionEventData) {
  try {
    const { data, error } = await supabase
      .from('subscription_events')
      .insert({
        user_id: eventData.user_id,
        event_type: eventData.event_type,
        plan_id: eventData.plan_id,
        plan_name: eventData.plan_name,
        previous_plan_id: eventData.previous_plan_id,
        previous_plan_name: eventData.previous_plan_name,
        metadata: eventData.metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving subscription event:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error saving subscription event:', error);
    return { success: false, error };
  }
}

/**
 * Save a payment event to the database
 */
export async function savePaymentEvent(eventData: PaymentEventData) {
  try {
    const { data, error } = await supabase
      .from('payment_events')
      .insert({
        user_id: eventData.user_id,
        event_type: eventData.event_type,
        amount: eventData.amount,
        currency: eventData.currency || 'usd',
        plan_id: eventData.plan_id,
        plan_name: eventData.plan_name,
        stripe_payment_intent_id: eventData.stripe_payment_intent_id,
        stripe_subscription_id: eventData.stripe_subscription_id,
        error_code: eventData.error_code,
        error_message: eventData.error_message,
        metadata: eventData.metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving payment event:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error saving payment event:', error);
    return { success: false, error };
  }
}

/**
 * Save a conversion event to the database
 */
export async function saveConversionEvent(eventData: ConversionEventData) {
  try {
    const { data, error } = await supabase
      .from('conversion_events')
      .insert({
        user_id: eventData.user_id,
        event_type: eventData.event_type,
        plan_id: eventData.plan_id,
        plan_name: eventData.plan_name,
        session_id: eventData.session_id,
        referrer: eventData.referrer,
        metadata: eventData.metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving conversion event:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error saving conversion event:', error);
    return { success: false, error };
  }
}

/**
 * Helper function to track subscription creation
 */
export async function trackSubscriptionCreated(
  userId: string,
  planId: string,
  planName: string,
  metadata?: Record<string, any>
) {
  return await saveSubscriptionEvent({
    user_id: userId,
    event_type: 'subscription_created',
    plan_id: planId,
    plan_name: planName,
    metadata
  });
}

/**
 * Helper function to track subscription cancellation
 */
export async function trackSubscriptionCancelled(
  userId: string,
  planId?: string,
  planName?: string,
  metadata?: Record<string, any>
) {
  return await saveSubscriptionEvent({
    user_id: userId,
    event_type: 'subscription_cancelled',
    plan_id: planId,
    plan_name: planName,
    metadata
  });
}

/**
 * Helper function to track successful payment
 */
export async function trackPaymentSucceeded(
  userId: string,
  amount: number,
  planId?: string,
  planName?: string,
  stripePaymentIntentId?: string,
  stripeSubscriptionId?: string,
  metadata?: Record<string, any>
) {
  return await savePaymentEvent({
    user_id: userId,
    event_type: 'payment_succeeded',
    amount,
    plan_id: planId,
    plan_name: planName,
    stripe_payment_intent_id: stripePaymentIntentId,
    stripe_subscription_id: stripeSubscriptionId,
    metadata
  });
}

/**
 * Helper function to track failed payment
 */
export async function trackPaymentFailed(
  userId: string,
  errorCode: string,
  errorMessage: string,
  planId?: string,
  planName?: string,
  metadata?: Record<string, any>
) {
  return await savePaymentEvent({
    user_id: userId,
    event_type: 'payment_failed',
    error_code: errorCode,
    error_message: errorMessage,
    plan_id: planId,
    plan_name: planName,
    metadata
  });
}

/**
 * Helper function to track plan view
 */
export async function trackPlanView(
  userId?: string,
  sessionId?: string,
  referrer?: string,
  metadata?: Record<string, any>
) {
  return await saveConversionEvent({
    user_id: userId,
    event_type: 'view_plans',
    session_id: sessionId,
    referrer: referrer,
    metadata
  });
}

/**
 * Helper function to track checkout start
 */
export async function trackCheckoutStart(
  userId: string,
  planId: string,
  planName: string,
  sessionId?: string,
  metadata?: Record<string, any>
) {
  return await saveConversionEvent({
    user_id: userId,
    event_type: 'start_checkout',
    plan_id: planId,
    plan_name: planName,
    session_id: sessionId,
    metadata
  });
}

/**
 * Helper function to track checkout completion
 */
export async function trackCheckoutComplete(
  userId: string,
  planId: string,
  planName: string,
  sessionId?: string,
  metadata?: Record<string, any>
) {
  return await saveConversionEvent({
    user_id: userId,
    event_type: 'complete_checkout',
    plan_id: planId,
    plan_name: planName,
    session_id: sessionId,
    metadata
  });
}