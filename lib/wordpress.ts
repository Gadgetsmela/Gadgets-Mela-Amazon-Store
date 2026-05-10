const WORDPRESS_ORIGIN = 'https://gadgetsmela2.com';
const WORDPRESS_POSTS_ENDPOINT = `${WORDPRESS_ORIGIN}/wp-json/wp/v2/posts`;
export const WORDPRESS_REVALIDATE_SECONDS = 60 * 15;

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export type WordPressCategory = {
  id: number;
  name: string;
  slug: string;
};

export type WordPressBlogPost = {
  id: number;
  title: string;
  excerpt: string;
  slug: string;
  link: string;
  date: string;
  featuredImage: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  categories: WordPressCategory[];
};

function decodeHtml(value = '') {
  return value.replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (entity, code) => {
    const normalizedCode = String(code).toLowerCase();
    if (normalizedCode.startsWith('#x')) return String.fromCharCode(Number.parseInt(normalizedCode.slice(2), 16));
    if (normalizedCode.startsWith('#')) return String.fromCharCode(Number.parseInt(normalizedCode.slice(1), 10));
    return HTML_ENTITY_MAP[normalizedCode] || entity;
  });
}

function stripHtml(value = '') {
  return decodeHtml(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function getFeaturedMedia(post: any) {
  const media = post?._embedded?.['wp:featuredmedia']?.[0];
  const sizes = media?.media_details?.sizes || {};
  const preferred = sizes.medium_large || sizes.large || sizes.full || {};

  return {
    src: preferred.source_url || media?.source_url || '',
    alt: stripHtml(media?.alt_text || post?.title?.rendered || 'Gadgets Mela blog post'),
    width: Number(preferred.width || media?.media_details?.width || 960),
    height: Number(preferred.height || media?.media_details?.height || 540),
  };
}

function getCategories(post: any): WordPressCategory[] {
  const termGroups = post?._embedded?.['wp:term'] || [];
  return termGroups
    .flat()
    .filter((term: any) => term?.taxonomy === 'category')
    .map((term: any) => ({
      id: Number(term.id),
      name: stripHtml(term.name),
      slug: String(term.slug || ''),
    }));
}

function normalizePost(post: any): WordPressBlogPost {
  return {
    id: Number(post.id),
    title: stripHtml(post?.title?.rendered || 'Untitled article'),
    excerpt: stripHtml(post?.excerpt?.rendered || '').slice(0, 180),
    slug: String(post.slug || ''),
    link: post.link || `${WORDPRESS_ORIGIN}/${post.slug || ''}`,
    date: post.date || '',
    featuredImage: getFeaturedMedia(post),
    categories: getCategories(post),
  };
}

export async function fetchLatestBlogPosts({ limit = 3, signal }: { limit?: number; signal?: AbortSignal } = {}) {
  const params = new URLSearchParams({
    _embed: 'wp:featuredmedia,wp:term',
    per_page: String(limit),
    orderby: 'date',
    order: 'desc',
  });

  const response = await fetch(`${WORDPRESS_POSTS_ENDPOINT}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`WordPress posts request failed with ${response.status}`);
  }

  const posts = await response.json();
  return Array.isArray(posts) ? posts.map(normalizePost) : [];
}

export { WORDPRESS_ORIGIN, WORDPRESS_POSTS_ENDPOINT };
