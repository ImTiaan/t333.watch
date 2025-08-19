'use client';

import * as React from 'react';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const getBadgeClasses = (variant: BadgeVariant = 'default') => {
  const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variantClasses = {
    default: 'border-transparent bg-[#9146FF] text-white hover:bg-[#7c3aed]',
    secondary: 'border-transparent bg-[#3a3a3d] text-white hover:bg-[#464649]',
    destructive: 'border-transparent bg-red-600 text-white hover:bg-red-700',
    outline: 'border-[#2d2d3a] text-white',
  };
  
  return `${baseClasses} ${variantClasses[variant]}`;
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const classes = `${getBadgeClasses(variant)} ${className}`.trim();
  
  return (
    <div className={classes} {...props} />
  );
}

export { Badge };