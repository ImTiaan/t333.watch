import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUser } from '@/lib/supabase';
import { twitchApi } from '@/lib/twitch-api';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
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
    
    // Check if the user has a Stripe customer ID
    if (!user.stripe_customer_id) {
      return NextResponse.json(
        { error: 'User does not have a Stripe customer ID' },
        { status: 400 }
      );
    }
    
    // Create a Stripe customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription`,
    });
    
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}