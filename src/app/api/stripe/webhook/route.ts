import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateUser, getUser, supabase } from '@/lib/supabase';
import { clearPremiumStatusCache } from '@/middleware/auth';
import analytics from '@/lib/analytics';
import {
  trackSubscriptionCreated,
  trackSubscriptionCancelled,
  trackPaymentSucceeded,
  trackPaymentFailed
} from '@/lib/subscription-analytics';
import {
  trackCompletePurchase,
  trackPaymentInfo
} from '@/lib/conversion-funnel';
import {
  initializeUserRetentionTracking,
  updateUserRetentionOnCancellation
} from '@/lib/retention-analytics';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any, // Type assertion to bypass version check
});

// Webhook endpoint for Stripe events
export async function POST(request: NextRequest) {
  try {
    // Get the signature from the headers
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }
    
    // Get the raw body
    const body = await request.text();
    
    // Verify the event
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get the user ID from the metadata
        const userId = session.metadata?.user_id;
        const twitchId = session.metadata?.twitch_id;
        
        if (!userId || !twitchId) {
          console.error('Missing user_id or twitch_id in session metadata');
          return NextResponse.json(
            { error: 'Missing user_id or twitch_id in session metadata' },
            { status: 400 }
          );
        }
        
        // Update the user's premium status
        await updateUser(userId, {
          premium_flag: true,
        });
        
        // Clear premium status cache to force refresh
        clearPremiumStatusCache(userId);
        
        // Track premium activation
        analytics.trackFeatureUsage('premium_activated', {
          userId,
          twitchId,
          timestamp: new Date().toISOString()
        });
        
        // Track subscription creation in analytics
        try {
          await trackSubscriptionCreated(
            userId,
            session.subscription as string,
            session.metadata?.plan_name || 'Premium',
            {
              twitchId,
              amount: session.amount_total || 0,
              currency: session.currency || 'usd',
              sessionId: session.id
            }
          );
          
          // Track purchase completion in conversion funnel
          await trackCompletePurchase(
            userId,
            session.metadata?.plan_id || 'premium',
            session.metadata?.plan_name || 'Premium',
            (session.amount_total || 0) / 100, // Convert from cents to dollars
            {
              sessionId: session.id,
              subscriptionId: session.subscription as string,
              paymentMethod: session.payment_method_types?.[0] || 'unknown'
            }
          );
          
          // Initialize retention tracking for new subscription
          await initializeUserRetentionTracking(
            userId,
            session.subscription as string,
            new Date(),
            session.amount_total || 0
          );
        } catch (error) {
          console.error('Failed to track subscription creation:', error);
        }
        
        console.log(`User ${twitchId} is now premium`);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get the customer ID
        const customerId = subscription.customer as string;
        
        // Find the user with this customer ID
        try {
          // Query Supabase for the user with this customer ID
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('stripe_customer_id', customerId)
            .single();
          
          if (error || !data) {
            console.error('Error finding user with customer ID:', customerId, error);
            return NextResponse.json(
              { error: 'User not found' },
              { status: 404 }
            );
          }
          
          // Update the user's premium status
          await updateUser(data.id, {
            premium_flag: false,
          });
          
          // Clear premium status cache to force refresh
          clearPremiumStatusCache(data.id);
          
          // Track premium deactivation
          analytics.trackFeatureUsage('premium_deactivated', {
            userId: data.id,
            twitchId: data.twitch_id,
            timestamp: new Date().toISOString()
          });
          
          // Track subscription cancellation in analytics
          try {
            await trackSubscriptionCancelled(
              data.id,
              subscription.id,
              'Premium',
              {
                twitchId: data.twitch_id,
                customerId,
                canceledAt: subscription.canceled_at
              }
            );
            
            // Update retention tracking for cancelled subscription
            await updateUserRetentionOnCancellation(
              data.id,
              subscription.id,
              subscription.cancellation_details?.reason || 'user_cancelled'
            );
          } catch (error) {
            console.error('Failed to track subscription cancellation:', error);
          }
          
          console.log(`User ${data.twitch_id} is no longer premium`);
        } catch (error) {
          console.error('Error handling subscription deleted event:', error);
          return NextResponse.json(
            { error: 'Error handling subscription deleted event' },
            { status: 500 }
          );
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Find the user with this customer ID
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('stripe_customer_id', invoice.customer as string)
            .single();
          
          if (!error && data) {
               // Track successful payment
                await trackPaymentSucceeded(
                  data.id,
                  (invoice.amount_paid || 0) / 100, // Convert from cents to dollars
                  undefined, // planId
                  'Premium', // planName
                  undefined, // stripePaymentIntentId
                  undefined, // stripeSubscriptionId - not available on invoice
                  {
                    twitchId: data.twitch_id,
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.number || undefined,
                    currency: invoice.currency || 'usd'
                  }
                );
             }
        } catch (error) {
          console.error('Failed to track payment success:', error);
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Find the user with this customer ID
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('stripe_customer_id', invoice.customer as string)
            .single();
          
          if (!error && data) {
            // Track failed payment
             await trackPaymentFailed(
               data.id,
               'payment_failed',
               'Invoice payment failed',
               undefined,
               'Premium',
               {
                 twitchId: data.twitch_id,
                 invoiceId: invoice.id,
                 amount: (invoice.amount_due || 0) / 100, // Convert from cents to dollars
                 currency: invoice.currency || 'usd'
               }
             );
          }
        } catch (error) {
          console.error('Failed to track payment failure:', error);
        }
        break;
      }
      
      // Add more event handlers as needed
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Error handling webhook' },
      { status: 500 }
    );
  }
}