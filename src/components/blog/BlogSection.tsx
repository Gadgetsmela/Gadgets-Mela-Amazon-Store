import { ArrowRight, ExternalLink, Newspaper, ShoppingBag, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { fetchLatestBlogPosts, WORDPRESS_REVALIDATE_SECONDS, type WordPressBlogPost } from '../../../lib/wordpress.ts';
import { getAffiliateUrl } from '../../utils/affiliate.js';

const BLOG_CACHE_KEY = 'gadgets-mela:wordpress-posts:v1';
const FALLBACK_IMAGE = '/brand/gadgets-mela-circle.svg';

type Product = {
  id?: string;
  asin?: string;
  name?: string;
  category?: string;
  summary?: string;
  tags?: string[];
};

type BlogSectionProps = {
  products?: Product[];
  selectedCountry?: string;
};

function readCachedPosts() {
  if (typeof window === 'undefined') return [];

  try {
    const cached = JSON.parse(window.localStorage.getItem(BLOG_CACHE_KEY) || 'null');
    if (!cached?.posts || !cached?.savedAt) return [];
    const ageSeconds = (Date.now() - cached.savedAt) / 1000;
    return ageSeconds <= WORDPRESS_REVALIDATE_SECONDS ? cached.posts : [];
  } catch {
    return [];
  }
}

function writeCachedPosts(posts: WordPressBlogPost[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(BLOG_CACHE_KEY, JSON.stringify({ posts, savedAt: Date.now() }));
  } catch {
    // Browser storage can be unavailable in private modes; the live fetch still renders posts.
  }
}

function getPostKeywords(post: WordPressBlogPost) {
  return [
    post.title,
    post.excerpt,
    post.slug,
    ...post.categories.map((category) => `${category.name} ${category.slug}`),
  ].join(' ').toLowerCase();
}

function getProductScore(product: Product, keywords: string) {
  const searchTerms = [product.category, product.name, product.summary, ...(product.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);

  return searchTerms.reduce((score, term) => score + (keywords.includes(term) ? 1 : 0), 0);
}

function findRelatedProduct(post: WordPressBlogPost, products: Product[] = []) {
  const keywords = getPostKeywords(post);
  const [bestMatch] = products
    .map((product) => ({ product, score: getProductScore(product, keywords) }))
    .sort((a, b) => b.score - a.score);

  return bestMatch?.score > 0 ? bestMatch.product : products[0];
}

function BlogCard({ post, product, selectedCountry }: { post: WordPressBlogPost; product?: Product; selectedCountry?: string }) {
  const affiliateUrl = product ? getAffiliateUrl(product, selectedCountry) : '#finds';
  const image = post.featuredImage?.src || FALLBACK_IMAGE;

  return (
    <article className="blog-card">
      <a className="blog-card-media" href={post.link} target="_blank" rel="noreferrer noopener" aria-label={`Read ${post.title}`}>
        <img
          src={image}
          alt={post.featuredImage?.alt || post.title}
          width={post.featuredImage?.width || 960}
          height={post.featuredImage?.height || 540}
          loading="lazy"
          decoding="async"
        />
        <span className="blog-card-glow" aria-hidden="true" />
      </a>
      <div className="blog-card-body">
        <div className="blog-card-meta">
          <span><Newspaper size={14} /> Blog</span>
          {post.categories.slice(0, 2).map((category) => (
            <span key={category.id || category.slug}>{category.name}</span>
          ))}
        </div>
        <h3>{post.title}</h3>
        <p>{post.excerpt || 'Explore the latest gadget insights, buying guidance, and hand-picked deal context from Gadgets Mela.'}</p>
        <div className="blog-card-actions">
          <a className="blog-read-button" href={post.link} target="_blank" rel="noreferrer noopener">
            Read Article <ExternalLink size={16} />
          </a>
          <a className="blog-deal-button" href={affiliateUrl} target="_blank" rel="noreferrer sponsored noopener">
            View Deal <ShoppingBag size={16} />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function BlogSection({ products = [], selectedCountry }: BlogSectionProps) {
  const [posts, setPosts] = useState<WordPressBlogPost[]>(() => readCachedPosts());
  const [isLoading, setIsLoading] = useState(() => posts.length === 0);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(posts.length === 0);

    fetchLatestBlogPosts({ limit: 3, signal: controller.signal })
      .then((latestPosts) => {
        setPosts(latestPosts);
        writeCachedPosts(latestPosts);
        setError('');
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError('WordPress stories are refreshing. Please check back soon.');
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  const cards = useMemo(() => posts.map((post) => ({ post, product: findRelatedProduct(post, products) })), [posts, products]);

  return (
    <section className="blog-section nav-anchor-section" aria-labelledby="latest-blog-title">
      <div className="section-heading blog-heading">
        <p className="eyebrow"><Sparkles size={15} /> WordPress insights</p>
        <h2 id="latest-blog-title">Latest From Blog</h2>
        <p>Fresh gadget guides from Gadgets Mela, paired with relevant affiliate deals for faster shopping.</p>
      </div>

      {isLoading && (
        <div className="blog-grid" aria-label="Loading blog posts">
          {[0, 1, 2].map((item) => <div className="blog-card blog-card-skeleton" key={item} />)}
        </div>
      )}

      {!isLoading && error && <p className="blog-status">{error}</p>}

      {!isLoading && !error && cards.length > 0 && (
        <div className="blog-grid">
          {cards.map(({ post, product }) => <BlogCard key={post.id} post={post} product={product} selectedCountry={selectedCountry} />)}
        </div>
      )}

      <a className="blog-all-link" href="https://gadgetsmela2.com" target="_blank" rel="noreferrer noopener">
        Visit full blog <ArrowRight size={16} />
      </a>
    </section>
  );
}
