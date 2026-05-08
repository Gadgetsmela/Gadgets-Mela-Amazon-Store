# Gadgets Mela Amazon Affiliate Store

A polished React + Vite storefront for an automated Amazon affiliate gadget curation brand. The app highlights product categories, live deal cards, editorial buying guides, affiliate disclosure messaging, newsletter capture UI, and an admin automation dashboard.

## Features

- Premium dark, mobile-first Amazon affiliate storefront
- Real Amazon Product Advertising API proxy for keyword search and ASIN refresh
- Admin dashboard for PA API search, ASIN import, wishlist import, Amazon URL import, and manual products
- Local product database persistence with daily auto-refresh scheduling
- Dynamic live prices, rating sync, discount percentage calculation, and automatic “Best Deal” badges
- Trending products section ranked from rating and discount signals
- Categories: Mobile, Audio, Gaming, Smart Home, Accessories, and Creator Setup
- Loading skeleton UI, product quick-view popup, WhatsApp share, and Telegram share
- SEO-ready product meta tags plus JSON-LD Product structured data
- Google indexing foundations through `robots.txt`, `sitemap.xml`, canonical tags, and schema output

## Getting Started

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Amazon PA API Setup

The browser app calls a secure serverless proxy at `/api/amazon` by default. Configure these environment variables in Vercel or your hosting platform so live Product Advertising API requests can be signed server-side:

```bash
AMAZON_PAAPI_ACCESS_KEY=your_paapi_access_key
AMAZON_PAAPI_SECRET_KEY=your_paapi_secret_key
AMAZON_ASSOCIATE_TAG=default_associate_tag
AMAZON_ASSOCIATE_TAG_IN=india_tag
AMAZON_ASSOCIATE_TAG_US=us_tag
AMAZON_ASSOCIATE_TAG_GB=uk_tag
AMAZON_ASSOCIATE_TAG_CA=canada_tag
```

If you deploy the proxy somewhere else, set `VITE_AMAZON_PAAPI_ENDPOINT` to that URL. When credentials are missing, the admin dashboard keeps working with safe placeholder imports so the UI can be tested without exposing secrets.

## Affiliate Setup

Associate tags are marketplace-specific. Update `src/data/countries.js` with your Amazon Associates tracking IDs and marketplace hosts. The app applies the selected country tag to every product URL at render time.

Keep the affiliate disclosure visible on every page and update `src/data/products.js` with starter ASINs or use the admin dashboard to import Amazon products.

## Disclaimer

As an Amazon Associate, Gadgets Mela may earn from qualifying purchases. Product prices and availability can change at any time on Amazon.
