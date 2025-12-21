import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function SEO({
  title,
  description,
  keywords,
  image,
  type = 'website',
  structuredData,
  twitterHandle = '@ChiStartupHub',
  noIndex = false,
  publishedTime,
  modifiedTime,
  author = 'Billy Ndizeye'
}) {
  const location = useLocation();
  const siteName = "ChiStartup Hub";
  const siteUrl = "https://chistartuphub.com";
  const currentUrl = siteUrl + location.pathname;
  // Use the custom OG image
  const defaultImage = `${siteUrl}/og-image.png`;
  const finalImage = image || defaultImage;

  useEffect(() => {
    // 1. Update Document Title
    document.title = title ? `${title} | ${siteName}` : siteName;

    // Helper to create or update meta tags
    const updateMeta = (name, content, attribute = 'name') => {
      if (content === undefined || content === null) return;
      
      // Find existing tag
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      // If not found, create it
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      // Update content
      element.setAttribute('content', content);
      return element;
    };

    // --- Standard Meta ---
    updateMeta('description', description);
    updateMeta('keywords', keywords);
    updateMeta('author', author);
    updateMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    updateMeta('googlebot', noIndex ? 'noindex, nofollow' : 'index, follow');

    // --- Geographic Meta (Local SEO for Chicago) ---
    updateMeta('geo.region', 'US-IL');
    updateMeta('geo.placename', 'Chicago');
    updateMeta('geo.position', '41.8781;-87.6298');
    updateMeta('ICBM', '41.8781, -87.6298');

    // --- Open Graph / Facebook ---
    updateMeta('og:type', type, 'property');
    updateMeta('og:site_name', siteName, 'property');
    updateMeta('og:title', title || siteName, 'property');
    updateMeta('og:description', description, 'property');
    updateMeta('og:image', finalImage, 'property');
    updateMeta('og:image:width', '1200', 'property');
    updateMeta('og:image:height', '630', 'property');
    updateMeta('og:image:alt', title || siteName, 'property');
    updateMeta('og:url', currentUrl, 'property');
    updateMeta('og:locale', 'en_US', 'property');

    // Article specific OG tags
    if (type === 'article') {
      updateMeta('article:author', author, 'property');
      if (publishedTime) updateMeta('article:published_time', publishedTime, 'property');
      if (modifiedTime) updateMeta('article:modified_time', modifiedTime, 'property');
    }

    // --- Twitter Cards ---
    updateMeta('twitter:card', 'summary_large_image', 'name');
    updateMeta('twitter:title', title || siteName, 'name');
    updateMeta('twitter:description', description, 'name');
    updateMeta('twitter:image', finalImage, 'name');
    updateMeta('twitter:image:alt', title || siteName, 'name');
    updateMeta('twitter:domain', 'chistartuphub.com', 'property');
    updateMeta('twitter:url', currentUrl, 'property');

    if (twitterHandle) {
      updateMeta('twitter:site', twitterHandle, 'name');
      updateMeta('twitter:creator', twitterHandle, 'name');
    }

    // --- Canonical Link ---
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // --- Structured Data (JSON-LD) ---
    // Default Organization schema
    const defaultStructuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${siteUrl}/#organization`,
          "name": siteName,
          "url": siteUrl,
          "logo": {
            "@type": "ImageObject",
            "url": `${siteUrl}/og-image.png`
          },
          "description": "Chicago's startup ecosystem directory. Find investors, workspaces, events, communities, and resources to help you build in Chicago.",
          "areaServed": {
            "@type": "City",
            "name": "Chicago",
            "addressRegion": "IL",
            "addressCountry": "US"
          },
          "founder": {
            "@type": "Person",
            "name": "Billy Ndizeye"
          }
        },
        {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          "url": siteUrl,
          "name": siteName,
          "publisher": {
            "@id": `${siteUrl}/#organization`
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${siteUrl}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@type": "WebPage",
          "@id": `${currentUrl}/#webpage`,
          "url": currentUrl,
          "name": title || siteName,
          "description": description,
          "isPartOf": {
            "@id": `${siteUrl}/#website`
          },
          "about": {
            "@id": `${siteUrl}/#organization`
          }
        }
      ]
    };

    const finalStructuredData = structuredData || defaultStructuredData;

    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(finalStructuredData);

  }, [title, description, keywords, finalImage, type, currentUrl, structuredData, twitterHandle, noIndex, publishedTime, modifiedTime, author, siteUrl]);

  return null;
}