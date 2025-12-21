// Weather Components - Barrel Exports
// v1.1 (2025-12-20): Replaced WeatherImpactAnalytics with WeatherBusinessImpact

// Main section orchestrator
export { default as WeatherSection } from './WeatherSection';

// Individual components
export { default as WeatherHero } from './WeatherHero';
export { default as HourlyForecast } from './HourlyForecast';
export { default as DailyForecast } from './DailyForecast';
export { default as WeatherMetricsGrid } from './WeatherMetricsGrid';
export { default as AnimatedWeatherIcon, WeatherIconWithBackground, getWeatherIcon, getWeatherIconInfo } from './AnimatedWeatherIcon';

// Business impact analytics (forward-looking 7-day forecast)
export { default as WeatherBusinessImpact } from './WeatherBusinessImpact';
