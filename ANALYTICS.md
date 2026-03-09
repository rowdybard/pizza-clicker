# Vercel Analytics Setup

This project includes Vercel Analytics to track user traffic and performance metrics.

## What's Tracked
- Page views and user sessions
- Geographic location (country/region level)
- Device types and browsers
- Performance metrics (Core Web Vitals)
- Referral sources

## Privacy
- No personal data is collected
- No cookies are used
- GDPR and CCPA compliant
- Anonymous, aggregated data only

## Setup
- Added `@vercel/analytics` package
- Imported `<Analytics />` component
- Placed at bottom of App component

## Viewing Data
Analytics data is available in your Vercel dashboard under the "Analytics" tab once deployed.

## Development
Analytics only works in production deployments, not in local development.
