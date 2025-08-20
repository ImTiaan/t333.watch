import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { clearPremiumStatusCache } from '@/middleware/auth';
import analytics from '@/lib/analytics';
import { config } from '@/lib/config';
import { requireAuth } from '@/middleware/auth';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const dbUser = user;
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!dbUser.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 400 }
      );
    }

    const { action, newPlan } = await request.json();

    if (!action || !['upgrade', 'downgrade', 'change'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be upgrade, downgrade, or change' },
        { status: 400 }
      );
    }

    if (!newPlan || !['monthly', 'yearly'].includes(newPlan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be monthly or yearly' },
        { status: 400 }
      );
    }

    // Get the user's current subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: dbUser.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    const currentSubscription = subscriptions.data[0];
    const currentPriceId = currentSubscription.items.data[0].price.id;

    // Determine the new price ID based on the plan
    const newPriceId = newPlan === 'monthly' 
      ? process.env.STRIPE_MONTHLY_PRICE_ID 
      : process.env.STRIPE_YEARLY_PRICE_ID;

    if (!newPriceId) {
      return NextResponse.json(
        { error: 'Price configuration not found' },
        { status: 500 }
      );
    }

    // Check if the user is trying to change to the same plan
    if (currentPriceId === newPriceId) {
      return NextResponse.json(
        { error: 'You are already on this plan' },
        { status: 400 }
      );
    }

    // Get current plan details for tracking
    const currentPlan = currentPriceId === process.env.STRIPE_MONTHLY_PRICE_ID ? 'monthly' : 'yearly';

    // Update the subscription
    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscription.id,
      {
        items: [{
          id: currentSubscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations', // Create prorations for immediate changes
      }
    );

    // Clear premium status cache to force refresh
    clearPremiumStatusCache(dbUser.id);

    // Track the subscription change
    analytics.trackFeatureUsage('subscription_plan_changed', {
      userId: dbUser.id,
      twitchId: user.login,
      action,
      fromPlan: currentPlan,
      toPlan: newPlan,
      subscriptionId: updatedSubscription.id,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        current_period_end: (updatedSubscription as any).current_period_end, // eslint-disable-line @typescript-eslint/no-explicit-any
        plan: newPlan
      },
      message: `Successfully ${action}d to ${newPlan} plan. Changes will be reflected in your next billing cycle.`
    });

  } catch (error) {
    console.error('Error modifying subscription:', error);
    
    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to modify subscription' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available plans and current subscription
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const dbUser = user;
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const plans = {
      monthly: {
        id: 'monthly',
        name: 'Monthly Premium',
        price: config.subscription.price,
        currency: 'usd',
        interval: 'month',
        features: [
          `Up to ${config.features.maxPremiumStreams} streams`,
          'Save and share Packs',
          'VOD synchronization',
          'Notifications for live Packs',
          'Priority support'
        ]
      },
      yearly: {
        id: 'yearly',
        name: 'Yearly Premium',
        price: config.subscription.price * 10, // 2 months free
        currency: 'usd',
        interval: 'year',
        savings: '17%',
        features: [
          `Up to ${config.features.maxPremiumStreams} streams`,
          'Save and share Packs',
          'VOD synchronization',
          'Notifications for live Packs',
          'Priority support',
          '2 months free (17% savings)'
        ]
      }
    };

    let currentSubscription = null;
    
    if (dbUser.stripe_customer_id) {
      // Get current subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: dbUser.stripe_customer_id,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        const priceId = sub.items.data[0].price.id;
        const currentPlan = priceId === process.env.STRIPE_MONTHLY_PRICE_ID ? 'monthly' : 'yearly';
        
        currentSubscription = {
          id: sub.id,
          status: sub.status,
          current_period_start: (sub as any).current_period_start, // eslint-disable-line @typescript-eslint/no-explicit-any
          current_period_end: (sub as any).current_period_end, // eslint-disable-line @typescript-eslint/no-explicit-any
          plan: currentPlan,
          cancel_at_period_end: (sub as any).cancel_at_period_end // eslint-disable-line @typescript-eslint/no-explicit-any
        };
      }
    }

    return NextResponse.json({
      plans,
      currentSubscription
    });

  } catch (error) {
    console.error('Error retrieving subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve subscription information' },
      { status: 500 }
    );
  }
}