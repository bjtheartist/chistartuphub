import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function GoogleAnalytics() {
  const location = useLocation();
  
  // Safely get GA Measurement ID from environment variables
  const getGAMeasurementId = () => {
    try {
      // Try different environment variable access patterns
      if (typeof process !== 'undefined' && process.env) {
        return process.env.REACT_APP_GA_MEASUREMENT_ID;
      }
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env.REACT_APP_GA_MEASUREMENT_ID;
      }
    } catch (e) {
      console.warn('Could not access environment variables:', e);
    }
    return null;
  };

  const GA_MEASUREMENT_ID = getGAMeasurementId();

  useEffect(() => {
    // Only initialize if measurement ID is provided
    if (!GA_MEASUREMENT_ID) {
      console.warn('Google Analytics Measurement ID not found. Please add REACT_APP_GA_MEASUREMENT_ID to your app secrets.');
      return;
    }

    // Load Google Analytics script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false, // We'll manually track page views
    });

    return () => {
      // Cleanup script on unmount
      const scripts = document.querySelectorAll(`script[src*="googletagmanager.com"]`);
      scripts.forEach(script => script.remove());
    };
  }, [GA_MEASUREMENT_ID]);

  // Track page views on route change
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !window.gtag) return;

    // Track page view
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });

    // Track time on page
    const startTime = Date.now();

    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000); // in seconds
      
      // Send time on page event
      if (window.gtag && timeSpent > 0) {
        window.gtag('event', 'time_on_page', {
          page_path: location.pathname,
          time_seconds: timeSpent,
          time_minutes: Math.round(timeSpent / 60 * 10) / 10, // rounded to 1 decimal
        });
      }
    };
  }, [location, GA_MEASUREMENT_ID]);

  return null; // This component doesn't render anything
}