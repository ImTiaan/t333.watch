import { NextRequest, NextResponse } from 'next/server';
import { requirePremium, validatePremiumLimits } from '@/middleware/auth';
import analytics from '@/lib/analytics';

/**
 * GET /api/premium/features
 * Get available premium features for the authenticated user
 * This endpoint requires premium status
 */
export async function GET(request: NextRequest) {
  try {
    // Require premium authentication
    const authResult = await requirePremium(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    // Track premium feature access
    analytics.trackFeatureUsage('premium_features_access', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      features: {
        customLayouts: {
          enabled: true,
          description: 'Create and save custom grid layouts'
        },
        streamPinning: {
          enabled: true,
          description: 'Pin important streams to prioritize them in layouts'
        },
        unlimitedStreams: {
          enabled: true,
          maxStreams: 9,
          description: 'Watch up to 9 streams simultaneously'
        },
        unlimitedPacks: {
          enabled: true,
          description: 'Save unlimited stream packs'
        },
        layoutSaving: {
          enabled: true,
          description: 'Save and load custom layouts'
        },
        advancedAnalytics: {
          enabled: true,
          description: 'Detailed viewing analytics and insights'
        }
      }
    });
  } catch (error) {
    console.error('Error getting premium features:', error);
    return NextResponse.json(
      { error: 'Failed to get premium features' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/premium/features/validate
 * Validate premium feature usage limits
 */
export async function POST(request: NextRequest) {
  try {
    // Require premium authentication
    const authResult = await requirePremium(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const body = await request.json();
    const { feature, currentUsage } = body;

    if (!feature || typeof currentUsage !== 'number') {
      return NextResponse.json(
        { error: 'Feature and currentUsage are required' },
        { status: 400 }
      );
    }

    // Validate premium limits
    const validation = validatePremiumLimits(user, feature, currentUsage);

    // Track validation attempt
    analytics.trackFeatureUsage('premium_limit_validation', {
      userId: user.id,
      feature,
      currentUsage,
      allowed: validation.allowed,
      timestamp: new Date().toISOString()
    });

    if (!validation.allowed) {
      return NextResponse.json(
        { 
          error: validation.error,
          allowed: false,
          feature,
          currentUsage
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      allowed: true,
      feature,
      currentUsage
    });
  } catch (error) {
    console.error('Error validating premium limits:', error);
    return NextResponse.json(
      { error: 'Failed to validate premium limits' },
      { status: 500 }
    );
  }
}