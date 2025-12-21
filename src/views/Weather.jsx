// Weather.jsx v1.2
// Weather Intelligence view - combines real-time forecast with business impact analytics
//
// v1.2 (2025-12-21): Backend OLS model integration
//   - Removed salesData prop (backend handles revenue correlation)
//   - WeatherBusinessImpact now uses useRevenuePrediction hook
// v1.1 (2025-12-20): Added sales data for business impact
// v1.0 (2025-12-20): Initial implementation

import React from 'react';
import { WeatherSection } from '../components/weather';

/**
 * Weather View
 *
 * Dedicated view for weather intelligence featuring:
 * - Real-time weather forecast from Visual Crossing API
 * - 24-hour hourly forecast with temperature chart
 * - 7-day daily forecast with expandable details
 * - Detailed weather metrics (UV, wind, pressure, etc.)
 * - Business impact predictions using backend OLS regression model
 */
const Weather = () => {
  return (
    <WeatherSection
      showAnalytics={true}
      showMetrics={true}
      refreshInterval={30 * 60 * 1000} // 30 minutes
    />
  );
};

export default Weather;
