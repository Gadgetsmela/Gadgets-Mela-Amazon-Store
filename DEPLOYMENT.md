# Deployment

## Netlify

1. Connect this repository.
2. Set the build command to `npm run build`.
3. Set the publish directory to `dist`.

## Vercel

1. Import this repository.
2. Choose the Vite preset.
3. Add `VITE_AMAZON_ASSOCIATE_TAG` for Production and Preview with your Amazon Associates tracking ID. With the Vercel CLI, run `vercel env add VITE_AMAZON_ASSOCIATE_TAG production` and `vercel env add VITE_AMAZON_ASSOCIATE_TAG preview`.
4. Deploy with default output directory `dist`.

Merging the production branch triggers a Vercel production deployment when the project is connected to Git. Check `https://store.gadgetsmela2.com` after the deployment finishes.

## GitHub Pages

Build locally with `npm run build` and publish the `dist` directory with your preferred Pages workflow.
