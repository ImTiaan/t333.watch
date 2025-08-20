import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUser } from '@/lib/supabase';
import { twitchApi } from '@/lib/twitch-api';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any, // Type assertion to bypass version check
});

export async function GET(request: NextRequest) {
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
      return NextResponse.json({
        subscriptions: [],
        invoices: [],
        paymentMethods: []
      });
    }
    
    // Get subscription history
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      limit: 10,
      expand: ['data.default_payment_method']
    });
    
    // Get invoice history
    const invoices = await stripe.invoices.list({
      customer: user.stripe_customer_id,
      limit: 20
    });
    
    // Get payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripe_customer_id,
      type: 'card'
    });
    
    // Format subscription data
    const formattedSubscriptions = subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      current_period_start: (sub as any).current_period_start,
      current_period_end: (sub as any).current_period_end,
      created: sub.created,
      canceled_at: (sub as any).canceled_at,
      ended_at: (sub as any).ended_at,
      plan: {
        id: sub.items.data[0]?.price.id,
        amount: sub.items.data[0]?.price.unit_amount,
        currency: sub.items.data[0]?.price.currency,
        interval: sub.items.data[0]?.price.recurring?.interval,
        product: sub.items.data[0]?.price.product
      },
      payment_method: sub.default_payment_method ? {
        id: (sub.default_payment_method as Stripe.PaymentMethod).id,
        type: (sub.default_payment_method as Stripe.PaymentMethod).type,
        card: (sub.default_payment_method as Stripe.PaymentMethod).card ? {
          brand: (sub.default_payment_method as Stripe.PaymentMethod).card?.brand,
          last4: (sub.default_payment_method as Stripe.PaymentMethod).card?.last4,
          exp_month: (sub.default_payment_method as Stripe.PaymentMethod).card?.exp_month,
          exp_year: (sub.default_payment_method as Stripe.PaymentMethod).card?.exp_year
        } : null
      } : null
    }));
    
    // Format invoice data
    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount_paid: invoice.amount_paid,
      amount_due: invoice.amount_due,
      currency: invoice.currency,
      created: invoice.created,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
      hosted_invoice_url: (invoice as any).hosted_invoice_url,
      invoice_pdf: (invoice as any).invoice_pdf,
      subscription_id: (invoice as any).subscription,
      payment_intent: (invoice as any).payment_intent ? {
        id: (invoice as any).payment_intent as string,
        status: invoice.status
      } : null
    }));
    
    // Format payment methods
    const formattedPaymentMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year
      } : null,
      created: pm.created
    }));
    
    return NextResponse.json({
      subscriptions: formattedSubscriptions,
      invoices: formattedInvoices,
      paymentMethods: formattedPaymentMethods
    });
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription history' },
      { status: 500 }
    );
  }
}