'use client';

import React, { useState } from 'react';
import { LayoutType, CustomLayoutConfig } from '@/lib/gridUtils';
import { isPremium } from '@/lib/premium';
import { useAuth } from '@/components/auth/AuthProvider';

interface LayoutSelectorProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType, config?: CustomLayoutConfig) => void;
  streamCount: number;
}

const layoutOptions = [
  {
    type: LayoutType.DEFAULT,
    name: 'Default',
    description: 'Primary stream with secondary streams',
    icon: '⊞',
    premium: false
  },
  {
    type: LayoutType.GRID_EQUAL,
    name: 'Equal Grid',
    description: 'All streams same size',
    icon: '⊟',
    premium: true
  },
  {
    type: LayoutType.SPOTLIGHT,
    name: 'Spotlight',
    description: 'One large stream, others small',
    icon: '◉',
    premium: true
  },
  {
    type: LayoutType.SIDEBAR,
    name: 'Sidebar',
    description: 'Main content with sidebar streams',
    icon: '⊡',
    premium: true
  }
];

export default function LayoutSelector({ currentLayout, onLayoutChange, streamCount }: LayoutSelectorProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const hasPremium = isPremium(user);

  const handleLayoutSelect = (layoutType: LayoutType) => {
    onLayoutChange(layoutType);
    setIsOpen(false);
  };

  const currentLayoutOption = layoutOptions.find(option => option.type === currentLayout);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[#18181b] hover:bg-[#2d2d3a] border border-[#2d2d3a] rounded-lg transition-colors"
        title="Change Layout"
      >
        <span className="text-lg">{currentLayoutOption?.icon || '⊞'}</span>
        <span className="text-sm font-medium">{currentLayoutOption?.name || 'Default'}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-[#18181b] border border-[#2d2d3a] rounded-lg shadow-lg z-50">
            <div className="p-2">
              <div className="text-xs text-gray-400 px-2 py-1 mb-2">
                Layout Options ({streamCount} streams)
              </div>
              
              {layoutOptions.map((option) => {
                const isDisabled = option.premium && !hasPremium;
                const isSelected = option.type === currentLayout;
                
                return (
                  <button
                    key={option.type}
                    onClick={() => !isDisabled && handleLayoutSelect(option.type)}
                    disabled={isDisabled}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                      ${isSelected 
                        ? 'bg-[#9146FF] text-white' 
                        : isDisabled 
                          ? 'text-gray-500 cursor-not-allowed' 
                          : 'hover:bg-[#2d2d3a] text-gray-200'
                      }
                    `}
                  >
                    <span className="text-lg">{option.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.name}</span>
                        {option.premium && (
                          <span className="text-xs bg-[#9146FF] text-white px-1.5 py-0.5 rounded">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {option.description}
                      </div>
                    </div>
                    {isSelected && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
              
              {!hasPremium && (
                <div className="mt-3 pt-3 border-t border-[#2d2d3a]">
                  <div className="text-xs text-gray-400 mb-2">
                    Unlock premium layouts
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      window.location.href = '/dashboard/subscription';
                    }}
                    className="w-full px-3 py-2 bg-[#9146FF] hover:bg-[#7a3dd3] text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Upgrade to Premium
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}