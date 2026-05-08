const fallbackAffiliateTag = 'gadgetsmela-20';

export const site = {
  name: 'Gadgets Mela',
  tagline: 'Curated Amazon gadget deals for smart shoppers',
  affiliateTag: import.meta.env.VITE_AMAZON_ASSOCIATE_TAG || fallbackAffiliateTag,
  supportEmail: 'hello@gadgetsmela.example',
};
