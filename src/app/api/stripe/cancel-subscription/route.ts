import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireAuth } from '@/middleware/auth';
import { clearPremiumStatusCache } from '@/middleware/auth';
import analytics from '@/lib/analytics';
import { updateUser } from '@/lib/supabase';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any, // Type assertion to bypass version check
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
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    const { feedback, reason, immediate = false } = await request.json();

    // Get the user's active subscription
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

    const subscription = subscriptions.data[0];

    // Cancel the subscription
    let canceledSubscription;
    if (immediate) {
      // Cancel immediately
      canceledSubscription = await stripe.subscriptions.cancel(subscription.id);
      
      // Update user's premium status immediately
      await updateUser(dbUser.id, { premium_flag: false });
      
      // Clear premium status cache
      clearPremiumStatusCache(dbUser.id);
    } else {
      // Cancel at period end
      canceledSubscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true
      });
    }

    // Track cancellation with feedback
    analytics.trackFeatureUsage('subscription_canceled', {
      userId: dbUser.id,
      subscriptionId: subscription.id,
      reason: reason || 'not_specified',
      feedback: feedback || '',
      immediate,
      canceledAt: new Date().toISOString(),
      periodEnd: immediate ? null : (canceledSubscription as any).current_period_end
    });

    // Log feedback for analysis
    console.log('Subscription cancellation feedback:', {
      userId: dbUser.id,
      reason,
      feedback,
      immediate,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        cancel_at_period_end: (canceledSubscription as any).cancel_at_period_end,
        current_period_end: (canceledSubscription as any).current_period_end
      },
      message: immediate 
        ? 'Your subscription has been canceled immediately. You no longer have access to premium features.'
        : `Your subscription will be canceled at the end of your current billing period (${new Date((canceledSubscription as any).current_period_end * 1000).toLocaleDateString()}). You'll continue to have access to premium features until then.`
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    
    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}