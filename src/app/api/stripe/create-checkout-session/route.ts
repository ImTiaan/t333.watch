import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUser, updateUser } from '@/lib/supabase';
import { twitchApi } from '@/lib/twitch-api';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    // Get the plan from the request body
    const { plan } = await request.json();
    
    // Get the access token from request cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const accessToken = cookies['twitch_access_token'];
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Set the access token in the Twitch API client
    twitchApi.setAccessToken(accessToken);
    
    // Get the user info from Twitch
    const twitchUser = await twitchApi.getUser();
    
    if (!twitchUser) {
      return NextResponse.json(
        { error: 'Failed to get user info' },
        { status: 400 }
      );
    }
    
    // Get the user from Supabase
    const user = await getUser(twitchUser.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }
    
    // Determine the price based on the plan
    const priceId = plan === 'yearly' 
      ? process.env.STRIPE_YEARLY_PRICE_ID 
      : process.env.STRIPE_MONTHLY_PRICE_ID;
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured' },
        { status: 500 }
      );
    }
    
    // Create or retrieve the Stripe customer
    let customerId = user.stripe_customer_id;
    
    if (!customerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: twitchUser.email,
        name: twitchUser.display_name,
        metadata: {
          twitch_id: twitchUser.id,
        },
      });
      
      customerId = customer.id;
      
      // Update the user in Supabase with the Stripe customer ID
      await updateUser(user.id, {
        stripe_customer_id: customerId,
      });
    }
    
    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?checkout=canceled`,
      metadata: {
        twitch_id: twitchUser.id,
        user_id: user.id,
      },
    });
    
    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}