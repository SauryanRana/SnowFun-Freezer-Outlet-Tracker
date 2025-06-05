/**
 * LoadingSpinner component for Snowfun Nepal application
 * 
 * A customizable loading spinner with different size options and optional text.
 * Designed to match the ice cream/frozen theme of the application.
 */

import React from 'react';

/**
 * Size mapping for spinner dimensions
 */
const SIZES = {
  xs: {
    spinner: 'h-4 w-4',
    text: 'text-xs',
    gap: 'gap-1'
  },
  sm: {
    spinner: 'h-5 w-5',
    text: 'text-sm',
    gap: 'gap-2'
  },
  md: {
    spinner: 'h-8 w-8',
    text: 'text-base',
    gap: 'gap-3'
  },
  lg: {
    spinner: 'h-10 w-10',
    text: 'text-lg',
    gap: 'gap-3'
  },
  xl: {
    spinner: 'h-12 w-12',
    text: 'text-xl',
    gap: 'gap-4'
  }
};

/**
 * LoadingSpinner Component
 * 
 * @param {Object} props Component props
 * @param {string} [props.size='md'] - Size of the spinner (xs, sm, md, lg, xl)
 * @param {string} [props.text] - Optional text to display with the spinner
 * @param {string} [props.textPlacement='bottom'] - Where to place the text ('bottom', 'right')
 * @param {string} [props.color='blue'] - Color theme ('blue', 'pink', 'white')
 * @param {string} [props.className] - Additional CSS classes
 */
export default function LoadingSpinner({
  size = 'md',
  text,
  textPlacement = 'bottom',
  color = 'blue',
  className = '',
}) {
  // Get size configuration
  const sizeConfig = SIZES[size] || SIZES.md;
  
  // Determine color classes
  const colorClasses = {
    blue: 'text-blue-600',
    pink: 'text-pink-500',
    white: 'text-white',
  }[color] || 'text-blue-600';
  
  // Determine flex direction based on text placement
  const flexDirection = textPlacement === 'right' ? 'flex-row' : 'flex-col';
  
  return (
    <div className={`flex items-center justify-center ${flexDirection} ${sizeConfig.gap} ${className}`}>
      {/* Custom ice cream cone spinner */}
      <div className={`relative ${sizeConfig.spinner}`}>
        <svg
          className={`animate-spin ${colorClasses}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        
        {/* Ice cream drip effect (optional decorative element) */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <div className={`w-1.5 h-3 rounded-b-full ${colorClasses} opacity-75`}></div>
        </div>
      </div>
      
      {/* Optional text */}
      {text && (
        <div className={`${sizeConfig.text} text-gray-600 dark:text-gray-300`}>
          {text}
        </div>
      )}
    </div>
  );
}

/**
 * Convenience components for different sizes
 */
export const SmallSpinner = (props) => <LoadingSpinner size="sm" {...props} />;
export const MediumSpinner = (props) => <LoadingSpinner size="md" {...props} />;
export const LargeSpinner = (props) => <LoadingSpinner size="lg" {...props} />;
