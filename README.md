# Gadgets Mela Amazon Affiliate Store

A polished React + Vite storefront for an Amazon affiliate gadget curation brand. The app highlights product categories, deal cards, editorial buying guides, affiliate disclosure messaging, and newsletter capture UI.

## Features

- Responsive marketplace landing page for gadget shoppers
- Amazon affiliate-ready product cards and CTA links
- Category filtering, search, and featured deal sections
- Buying guide content for trust-building SEO pages
- Affiliate disclosure and privacy-friendly static front end
- Lightweight Vite build suitable for Netlify, Vercel, or GitHub Pages

## Getting Started

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Affiliate Setup

Set `VITE_AMAZON_ASSOCIATE_TAG` to your Amazon Associates tracking ID. The app applies this tag to every product URL at render time, so Vercel can change the live tracking ID without editing product data.

For Amazon OneLink, link your international Associates accounts in Amazon Associates Central, then keep the primary US tracking ID in `VITE_AMAZON_ASSOCIATE_TAG`. Amazon notes that Associate tags are marketplace-specific and OneLink can redirect international shoppers from US affiliate links when configured in Associates Central.

Update `src/data/products.js` with live Amazon product URLs. Keep the affiliate disclosure visible on every page.

## Disclaimer

As an Amazon Associate, Gadgets Mela may earn from qualifying purchases. Product prices and availability can change at any time on Amazon.
