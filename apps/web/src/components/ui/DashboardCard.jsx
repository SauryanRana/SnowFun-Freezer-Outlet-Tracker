/**
 * DashboardCard component for Snowfun Nepal application
 * 
 * A reusable card component for displaying statistics on dashboards
 * with support for icons, values, trends, and progress indicators.
 */

import React from 'react';

/**
 * Dashboard statistic card component
 * 
 * @param {Object} props Component props
 * @param {string} props.title Title of the statistic
 * @param {number|string} props.value Value to display
 * @param {React.ReactNode} props.icon Icon component to display
 * @param {number} [props.trend] Optional trend value (positive or negative)
 * @param {string} [props.trendLabel] Optional label for the trend
 * @param {boolean} [props.loading] Whether the card is in loading state
 * @param {number} [props.progressValue] Optional progress percentage (0-100)
 */
export default function DashboardCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  loading = false,
  progressValue,
}) {
  // Format large numbers with commas
  const formatNumber = (num) => {
    if (typeof num !== 'number') return num;
    return new Intl.NumberFormat().format(num);
  };

  // Determine trend color and icon
  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  // Trend arrow based on value
  const TrendArrow = ({ value }) => {
    if (value > 0) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }
    if (value < 0) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
      {/* Card Header with Icon and Title */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="p-2 rounded-full bg-blue-50 flex items-center justify-center">
          {icon}
        </div>
      </div>

      {/* Card Value */}
      <div className="mb-2">
        {loading ? (
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <div className="text-2xl font-bold text-gray-900">{formatNumber(value)}</div>
        )}
      </div>

      {/* Trend Indicator */}
      {(trend !== undefined || trendLabel) && (
        <div className="flex items-center">
          {loading ? (
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <>
              {trend !== undefined && (
                <span className={`flex items-center text-sm font-medium ${getTrendColor(trend)}`}>
                  <TrendArrow value={trend} />
                  <span className="ml-1">{trend > 0 ? '+' : ''}{trend}%</span>
                </span>
              )}
              {trendLabel && (
                <span className="text-sm text-gray-500 ml-1">{trendLabel}</span>
              )}
            </>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {progressValue !== undefined && (
        <div className="mt-3">
          {loading ? (
            <div className="h-2 w-full bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${Math.min(Math.max(progressValue, 0), 100)}%` }}
              ></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
