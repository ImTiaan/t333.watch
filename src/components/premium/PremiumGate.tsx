'use client';

import React from 'react';
import { usePremiumVerification, usePremiumFeatureTracking } from '@/hooks/usePremiumVerification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  className?: string;
}

/**
 * Component that gates premium features and shows upgrade prompts
 */
export function PremiumGate({ 
  children, 
  feature, 
  fallback, 
  showUpgrade = true, 
  className 
}: PremiumGateProps) {
  const { isPremium, isLoading, error } = usePremiumVerification();
  const { trackFeatureBlocked } = usePremiumFeatureTracking();

  // Show loading state
  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md h-20 ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-gray-500">Checking premium status...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <Lock className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-400">
            Unable to verify premium status: {error}
          </span>
        </div>
      </div>
    );
  }

  // If user has premium access, show the children
  if (isPremium) {
    return <>{children}</>;
  }

  // Track feature blocking
  if (feature) {
    trackFeatureBlocked(feature, 'premium_required');
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt if enabled
  if (showUpgrade) {
    return (
      <PremiumUpgradePrompt 
        feature={feature} 
        className={className}
      />
    );
  }

  // Default: show nothing
  return null;
}

/**
 * Premium upgrade prompt component
 */
interface PremiumUpgradePromptProps {
  feature?: string;
  className?: string;
  compact?: boolean;
}

export function PremiumUpgradePrompt({ 
  feature, 
  className, 
  compact = false 
}: PremiumUpgradePromptProps) {
  const { trackFeatureBlocked } = usePremiumFeatureTracking();

  const handleUpgradeClick = () => {
    trackFeatureBlocked(feature || 'unknown', 'upgrade_clicked');
  };

  if (compact) {
    return (
      <div className={`bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-md p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Premium Feature
            </span>
          </div>
          <Link href="/dashboard/subscription/upgrade">
            <Button 
              size="sm" 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleUpgradeClick}
            >
              Upgrade
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800 ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 p-3 bg-purple-100 dark:bg-purple-900/40 rounded-full w-fit">
          <Crown className="h-6 w-6 text-purple-600" />
        </div>
        <CardTitle className="text-purple-900 dark:text-purple-100">
          Premium Feature
        </CardTitle>
        <CardDescription className="text-purple-700 dark:text-purple-300">
          {feature ? `${feature} requires a premium subscription` : 'This feature requires a premium subscription'}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-purple-800 dark:text-purple-200">
              Unlock unlimited streams, custom layouts, and more
            </span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/dashboard/subscription/upgrade">
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleUpgradeClick}
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </Link>
          <Link href="/dashboard/subscription">
            <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
              Learn More
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Premium badge component
 */
interface PremiumBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PremiumBadge({ className, size = 'md' }: PremiumBadgeProps) {
  const { isPremium, isLoading } = usePremiumVerification();

  if (isLoading || !isPremium) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white ${sizeClasses[size]} ${className}`}
    >
      <Crown className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />
      Premium
    </Badge>
  );
}

/**
 * Premium feature list component
 */
export function PremiumFeatureList() {
  const features = [
    {
      name: 'Unlimited Streams',
      description: 'Watch up to 9 streams simultaneously',
      icon: '📺'
    },
    {
      name: 'Custom Layouts',
      description: 'Create and save custom grid layouts',
      icon: '🎨'
    },
    {
      name: 'Stream Pinning',
      description: 'Pin important streams to prioritize them',
      icon: '📌'
    },
    {
      name: 'Unlimited Packs',
      description: 'Save unlimited stream collections',
      icon: '📦'
    },
    {
      name: 'Layout Saving',
      description: 'Save and load your favorite layouts',
      icon: '💾'
    },
    {
      name: 'Advanced Analytics',
      description: 'Detailed viewing insights and statistics',
      icon: '📊'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {features.map((feature, index) => (
        <div 
          key={index}
          className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <span className="text-2xl">{feature.icon}</span>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {feature.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {feature.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}