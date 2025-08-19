import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateUser, getUser, supabase } from '@/lib/supabase';

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