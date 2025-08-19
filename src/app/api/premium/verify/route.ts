import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyPremiumStatusCached } from '@/middleware/auth';
import analytics, { EventCategory, FeatureEvents } from '@/lib/analytics';

/**
 * GET /api/premium/verify
 * Verify premium status for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    // Verify premium status with caching
    const isPremium = verifyPremiumStatusCached(user);

    // Track premium verification event
    analytics.trackFeatureUsage('premium_status_check', {
      userId: user.id,
      isPremium,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      isPremium,
      user: {
        id: user.id,
        display_name: user.display_name,
        premium_flag: user.premium_flag
      },
      features: {
        maxStreams: isPremium ? 9 : 3,
        unlimitedPacks: isPremium,
        customLayouts: isPremium,
        streamPinning: isPremium,
        layoutSaving: isPremium
      }
    });
  } catch (error) {
    console.error('Error verifying premium status:', error);
    return NextResponse.json(
      { error: 'Failed to verify premium status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/premium/verify
 * Force refresh premium status from Stripe (for webhook updates)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    // Clear cached premium status to force refresh
    const { clearPremiumStatusCache } = await import('@/middleware/auth');
    clearPremiumStatusCache(user.id);

    // Get fresh premium status
    const isPremium = verifyPremiumStatusCached(user);

    // Track premium status refresh
    analytics.trackFeatureUsage('premium_status_refresh', {
      userId: user.id,
      isPremium,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      isPremium,
      refreshed: true
    });
  } catch (error) {
    console.error('Error refreshing premium status:', error);
    return NextResponse.json(
      { error: 'Failed to refresh premium status' },
      { status: 500 }
    );
  }
}