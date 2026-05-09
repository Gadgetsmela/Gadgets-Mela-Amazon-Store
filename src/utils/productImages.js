const AMAZON_MEDIA_HOST = 'https://m.media-amazon.com/images';
const IMAGE_CANDIDATE_LIMIT = 6;

function encodeSvg(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function stableHue(value) {
  return [...String(value || 'Gadgets Mela')].reduce((total, char) => total + char.charCodeAt(0), 0) % 45;
}

export function createProductPlaceholder(product = {}) {
  const title = String(product.name || product.title || product.asin || 'Gadgets Mela').slice(0, 54);
  const brand = String(product.brand || product.category || 'Amazon Deal').slice(0, 24);
  const hue = stableHue(`${title}${brand}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200" role="img" aria-label="${title}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="hsl(${22 + hue} 96% 54%)" stop-opacity="0.88"/>
        <stop offset="0.48" stop-color="#111827"/>
        <stop offset="1" stop-color="#020617"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="38%" r="55%">
        <stop offset="0" stop-color="#fed7aa" stop-opacity="0.55"/>
        <stop offset="1" stop-color="#fed7aa" stop-opacity="0"/>
      </radialGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="28" stdDeviation="28" flood-color="#020617" flood-opacity="0.48"/>
      </filter>
    </defs>
    <rect width="900" height="1200" rx="64" fill="url(#bg)"/>
    <circle cx="450" cy="370" r="310" fill="url(#glow)"/>
    <g filter="url(#shadow)">
      <rect x="245" y="270" width="410" height="310" rx="48" fill="#0f172a" stroke="#fb923c" stroke-width="12"/>
      <rect x="315" y="350" width="270" height="92" rx="24" fill="#facc15" opacity="0.95"/>
      <circle cx="335" cy="640" r="44" fill="#fed7aa"/>
      <circle cx="565" cy="640" r="44" fill="#fed7aa"/>
      <path d="M270 590h360l-42 96H322z" fill="#fb923c"/>
    </g>
    <text x="450" y="835" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="48" font-weight="900" fill="#fff">GADGETS MELA</text>
    <text x="450" y="904" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="34" font-weight="800" fill="#fed7aa">${brand.replace(/[<&]/g, '')}</text>
    <foreignObject x="110" y="945" width="680" height="160">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Inter,Arial,sans-serif;color:#fff;font-size:42px;font-weight:900;line-height:1.12;text-align:center;">${title.replace(/[<&]/g, '')}</div>
    </foreignObject>
  </svg>`;
  return encodeSvg(svg);
}

export function getAmazonImageUrl(asin, size = 800) {
  const cleanAsin = String(asin || '').trim().toUpperCase();
  if (!cleanAsin) return '';
  return `${AMAZON_MEDIA_HOST}/P/${cleanAsin}.01._AC_SL${size}_.jpg`;
}

export function getAmazonThumbnailUrl(asin) {
  const cleanAsin = String(asin || '').trim().toUpperCase();
  if (!cleanAsin) return '';
  return `${AMAZON_MEDIA_HOST}/P/${cleanAsin}.01._AC_SR240,240_.jpg`;
}

export function getAmazonGalleryUrls(asin) {
  const cleanAsin = String(asin || '').trim().toUpperCase();
  if (!cleanAsin) return [];
  return [getAmazonImageUrl(cleanAsin, 800), getAmazonImageUrl(cleanAsin, 600), getAmazonImageUrl(cleanAsin, 400)].filter(Boolean);
}

export function repairAmazonImageUrl(url, asin = '') {
  const value = String(url || '').trim();
  if (!value) return getAmazonImageUrl(asin);
  if (value.startsWith('data:') || value.startsWith('/')) return value;

  try {
    const parsed = new globalThis.URL(value);
    const isAmazonImage = /(^|\.)amazon\.|(^|\.)ssl-images-amazon\.|(^|\.)media-amazon\./i.test(parsed.hostname);
    if (!isAmazonImage) return value;

    parsed.protocol = 'https:';
    parsed.hostname = 'm.media-amazon.com';
    parsed.pathname = parsed.pathname
      .replace(/^\/images\/G\//, '/images/I/')
      .replace(/\/images\/[^/]+\//, '/images/I/')
      .replace(/\._[^./]+_\.(jpg|jpeg|png|webp)$/i, '._AC_SL800_.$1');
    parsed.search = '';
    return parsed.toString();
  } catch {
    return getAmazonImageUrl(asin) || value;
  }
}

function uniqueImages(images) {
  return [...new Set(images.map((image) => String(image || '').trim()).filter(Boolean))];
}

export function normalizeProductImages(product = {}) {
  const asinImage = getAmazonImageUrl(product.asin);
  const placeholder = createProductPlaceholder(product);
  const galleryImages = uniqueImages([
    product.image,
    ...(Array.isArray(product.galleryImages) ? product.galleryImages : []),
    asinImage,
  ]).map((image) => repairAmazonImageUrl(image, product.asin));
  const image = repairAmazonImageUrl(product.image || galleryImages[0] || asinImage || placeholder, product.asin) || placeholder;
  const thumbnail = repairAmazonImageUrl(product.thumbnail || getAmazonThumbnailUrl(product.asin) || image, product.asin) || placeholder;

  return {
    image,
    galleryImages: uniqueImages([image, ...galleryImages, placeholder]).slice(0, IMAGE_CANDIDATE_LIMIT),
    thumbnail,
    placeholder,
    imageRatio: product.imageRatio || 'square',
  };
}

export function getProductImageCandidates(product = {}) {
  const normalized = normalizeProductImages(product);
  return uniqueImages([
    normalized.image,
    normalized.thumbnail,
    ...(normalized.galleryImages || []),
    normalized.placeholder,
  ]).slice(0, IMAGE_CANDIDATE_LIMIT);
}

export function getOptimizedImageSources(product = {}) {
  const normalized = normalizeProductImages(product);
  return {
    src: normalized.image,
    thumbnail: normalized.thumbnail,
    placeholder: normalized.placeholder,
    galleryImages: normalized.galleryImages,
    webp: product.imageWebp || product.webpImage || '',
    thumbnailWebp: product.thumbnailWebp || '',
    ratio: normalized.imageRatio,
  };
}
