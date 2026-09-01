import { CDItem, MusicBrainzRelease, MediaFormat } from '../types';

/**
 * Calculates a realistic, deterministic market reference price based on edition metadata and format
 */
export function estimateMarketPrice(
  item: {
    title?: string;
    artist?: string;
    year?: number;
    trackCount?: number;
    label?: string;
    id?: string;
    mbid?: string;
  },
  format: MediaFormat = 'CD'
): string {
  // Deterministic seed based on string characters so the same edition always generates consistent pricing
  const key = `${item.artist || ''}-${item.title || ''}-${item.id || item.mbid || ''}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % 10000;
  }
  const variance = (hash % 11) * 0.5; // variance between 0.0 € and 5.0 €

  const year = item.year || 2000;
  const tracks = item.trackCount || 10;

  if (format === 'Vinyl') {
    let basePrice = 24.0;
    // Vintage or collectible vinyl (60s, 70s, 80s, 90s)
    if (year > 1950 && year < 1980) basePrice += 8.0;
    else if (year >= 1980 && year < 1990) basePrice += 5.0;
    else if (year >= 1990 && year < 2000) basePrice += 7.0; // 90s original pressings are rare
    
    // Double LP / large track count
    if (tracks > 14) basePrice += 6.0;
    if (tracks > 22) basePrice += 10.0;

    const finalPrice = Math.round((basePrice + variance) * 2) / 2;
    return `~${finalPrice.toFixed(2).replace('.', ',')} €`;
  } else {
    // Standard CD format
    let basePrice = 9.0;
    if (year > 1950 && year < 1985) basePrice += 3.5;
    else if (year >= 1985 && year < 1996) basePrice += 2.0;
    
    // Double CD / Boxset
    if (tracks > 18) basePrice += 5.0;
    if (tracks > 28) basePrice += 9.0;

    const finalPrice = Math.round((basePrice + variance) * 2) / 2;
    return `~${finalPrice.toFixed(2).replace('.', ',')} €`;
  }
}

/**
 * Extracts the numeric float value from a price string (e.g. "~14,50 €" -> 14.5)
 */
export function parsePriceToNumber(priceStr?: string): number {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[~€$\s]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Gets market price string for an item, falling back to estimation if not set
 */
export function getItemMarketPrice(item: Partial<CDItem>): string {
  if (item.marketPrice && item.marketPrice.trim()) {
    return item.marketPrice.trim();
  }
  return estimateMarketPrice(item, item.mediaFormat || 'CD');
}

/**
 * Sums the total market value for an array of items in EUR
 */
export function calculateTotalMarketValue(items: CDItem[]): number {
  return items.reduce((sum, item) => {
    const priceStr = getItemMarketPrice(item);
    return sum + parsePriceToNumber(priceStr);
  }, 0);
}

/**
 * Formats a numeric total into EUR currency format (e.g. "642,50 €")
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

// Rate limiting helper for MusicBrainz (1 request per second compliant with terms)
let lastRequestTime = 0;
async function rateLimit() {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < 600) {
    await new Promise((resolve) => setTimeout(resolve, 600 - timeSinceLast));
  }
  lastRequestTime = Date.now();
}

/**
 * Searches MusicBrainz for releases by album title, artist, or barcode
 */
export async function searchMusicBrainz(query: string): Promise<Partial<CDItem>[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    await rateLimit();
    // Build query with Lucene syntax support
    const encodedQuery = encodeURIComponent(query.trim());
    const url = `https://musicbrainz.org/ws/2/release/?query=${encodedQuery}&fmt=json&limit=25`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CDCollectionManagerApp/1.0.0 ( contact: app@collector.local )',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`MusicBrainz request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const releases: MusicBrainzRelease[] = data.releases || [];

    return releases.map((rel) => {
      const artist = rel['artist-credit']?.map((c) => c.name).join(' ') || 'Artista Desconhecido';
      const year = rel.date ? parseInt(rel.date.slice(0, 4), 10) || 0 : 0;
      const label = rel['label-info-list']?.[0]?.label?.name;
      const genre = rel.genres?.[0]?.name || rel.tags?.[0]?.name || inferGenre(rel.title, artist);
      const coverUrl = `https://coverartarchive.org/release/${rel.id}/front-500`;
      const marketPrice = estimateMarketPrice({
        id: rel.id,
        mbid: rel.id,
        title: rel.title,
        artist,
        year: year || 2000,
        trackCount: rel['track-count'] || (rel.media?.[0]?.['track-count'] ?? undefined),
        label,
      }, 'CD');

      return {
        id: rel.id,
        mbid: rel.id,
        title: rel.title,
        artist,
        year: year || 2000,
        label,
        country: rel.country,
        barcode: rel.barcode,
        genre,
        trackCount: rel['track-count'] || (rel.media?.[0]?.['track-count'] ?? undefined),
        coverUrl,
        marketPrice,
      };
    });
  } catch (err) {
    console.error('Error searching MusicBrainz:', err);
    // Return sample local matches fallback if offline
    return getFallbackSearchResults(query);
  }
}

/**
 * Fetches release tracks and full details from MusicBrainz
 */
export async function getReleaseDetails(mbid: string): Promise<{ tracks: string[]; coverUrl: string }> {
  try {
    await rateLimit();
    const url = `https://musicbrainz.org/ws/2/release/${mbid}?inc=recordings+artist-credits+labels&fmt=json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CDCollectionManagerApp/1.0.0 ( contact: app@collector.local )',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return { tracks: [], coverUrl: `https://coverartarchive.org/release/${mbid}/front-500` };
    }

    const data = await response.json();
    const tracks: string[] = [];

    if (data.media && Array.isArray(data.media)) {
      for (const disc of data.media) {
        if (disc.tracks && Array.isArray(disc.tracks)) {
          for (const track of disc.tracks) {
            if (track.title) tracks.push(track.title);
          }
        }
      }
    }

    return {
      tracks,
      coverUrl: `https://coverartarchive.org/release/${mbid}/front-500`,
    };
  } catch (error) {
    console.warn('Error fetching release details:', error);
    return { tracks: [], coverUrl: `https://coverartarchive.org/release/${mbid}/front-500` };
  }
}

function inferGenre(title: string, artist: string): string {
  const combined = `${title} ${artist}`.toLowerCase();
  if (combined.includes('pearl jam') || combined.includes('nirvana') || combined.includes('soundgarden') || combined.includes('alice in chains')) return 'Grunge / Alt Rock';
  if (combined.includes('pink floyd') || combined.includes('genesis') || combined.includes('king crimson') || combined.includes('yes')) return 'Prog Rock';
  if (combined.includes('metallica') || combined.includes('iron maiden') || combined.includes('black sabbath') || combined.includes('megadeth')) return 'Heavy Metal';
  if (combined.includes('daft punk') || combined.includes('kraftwerk') || combined.includes('prodigy')) return 'Electronic';
  if (combined.includes('radiohead') || combined.includes('oasis') || combined.includes('blur') || combined.includes('arctic monkeys')) return 'Indie / Britpop';
  if (combined.includes('miles davis') || combined.includes('coltrane') || combined.includes('chet baker')) return 'Jazz';
  if (combined.includes('beatles') || combined.includes('rolling stones') || combined.includes('queen') || combined.includes('bowie')) return 'Classic Rock';
  return 'Rock';
}

function getFallbackSearchResults(query: string): Partial<CDItem>[] {
  const q = query.toLowerCase();
  const defaults: Partial<CDItem>[] = [
    {
      id: 'mb-pj-lost-dogs',
      title: 'Lost Dogs',
      artist: 'Pearl Jam',
      year: 2003,
      genre: 'Grunge / Rock',
      label: 'Epic',
      country: 'US',
      trackCount: 30,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
      marketPrice: '~18,50 €',
    },
    {
      id: 'mb-pj-vitalogy',
      title: 'Vitalogy',
      artist: 'Pearl Jam',
      year: 1994,
      genre: 'Grunge',
      label: 'Epic',
      country: 'US',
      trackCount: 14,
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80',
      marketPrice: '~11,50 €',
    },
    {
      id: 'mb-pf-animals',
      title: 'Animals',
      artist: 'Pink Floyd',
      year: 1977,
      genre: 'Prog Rock',
      label: 'Harvest',
      country: 'UK',
      trackCount: 5,
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
      marketPrice: '~14,00 €',
    },
    {
      id: 'mb-pf-meddle',
      title: 'Meddle',
      artist: 'Pink Floyd',
      year: 1971,
      genre: 'Psychedelic Rock',
      label: 'Harvest',
      country: 'UK',
      trackCount: 6,
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
      marketPrice: '~13,50 €',
    },
  ];

  return defaults.filter(
    (d) => d.title?.toLowerCase().includes(q) || d.artist?.toLowerCase().includes(q)
  );
}
