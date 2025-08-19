'use client';

import * as React from 'react';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

const getButtonClasses = (variant: ButtonVariant = 'default', size: ButtonSize = 'default') => {
  const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variantClasses = {
    default: 'bg-[#9146FF] text-white hover:bg-[#7c3aed]',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-[#2d2d3a] bg-transparent hover:bg-[#2d2d3a] text-white',
    secondary: 'bg-[#3a3a3d] text-white hover:bg-[#464649]',
    ghost: 'hover:bg-[#2d2d3a] text-white',
    link: 'text-[#9146FF] underline-offset-4 hover:underline',
  };
  
  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  };
  
  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const classes = `${getButtonClasses(variant, size)} ${className}`.trim();
    
    return (
      <button
        className={classes}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };