/**
 * Application configuration
 */

export const config = {
  // Application information
  appName: 't333.watch',
  appDescription: 'Watch multiple Twitch streams simultaneously',
  
  // Twitch API credentials
  twitch: {
    clientId: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || '',
    clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
    redirectUri: process.env.NEXT_PUBLIC_TWITCH_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  },
  
  // Feature flags and limits
  features: {
    maxFreeStreams: 3,
    maxPremiumStreams: 9,
    enableVodSync: true,
    enableNotifications: true,
    enableCustomLayouts: true,
    enableStreamPinning: true,
    enableLayoutSaving: true,
  },
  
  // Subscription pricing
  subscription: {
    price: 5.99,
    currency: 'USD',
    interval: 'month',
  },
};