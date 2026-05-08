export function withAffiliateTag(url, tag = 'gadgetsmela-20') {
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.set('tag', tag);
  return parsedUrl.toString();
}
