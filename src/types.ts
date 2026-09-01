export type CDStatus = 'collection' | 'wishlist' | 'loaned';
export type MediaFormat = 'CD' | 'Vinyl';
export type ReleaseType = 'Album' | 'Single' | 'EP';

export interface CDItem {
  id: string;
  title: string;          // Álbum / Single
  artist: string;         // Banda/Artista
  year: number;           // Ano de lançamento
  genre?: string;         // (Legado, não utilizado na interface)
  mediaFormat?: MediaFormat; // Formato: 'CD' | 'Vinyl'
  releaseType?: ReleaseType; // Tipo: 'Album' | 'Single' | 'EP'
  coverUrl?: string;      // Capa
  mbid?: string;          // MusicBrainz Release ID
  barcode?: string;
  label?: string;
  country?: string;
  trackCount?: number;
  tracks?: string[];
  status: CDStatus;
  
  // Market & Pricing fields
  marketPrice?: string;   // Preço de mercado estimado / referência (ex: "~14,50 €")

  // Wishlist specific fields
  desiredPrice?: string;  // Preço pretendido (ex: "15 €")
  purchaseNotes?: string; // Notas de compra (ex: "procurar edição deluxe / remaster 2011")
  priority?: 'high' | 'medium' | 'low';
  
  // Date tracking
  addedAt: string;                 // Data em que foi criado/adicionado ao sistema
  addedToCollectionDate?: string;  // Data em que passou para a coleção
  
  // Collection / Loan tracking
  loanedTo?: string;
  loanDate?: string;
  condition?: 'Mint' | 'Very Good' | 'Good' | 'Fair' | 'Sealed';
  shelfLocation?: string;
  actualPrice?: string;
  rating?: number;
}

export type WishlistSortOption =
  | 'artist_asc'
  | 'artist_desc'
  | 'album_asc'
  | 'year'
  | 'recently_added'
  | 'oldest_added';

export type WishlistViewMode = 'cds' | 'bands';
export type ViewMode = 'cds' | 'bands';
export type DisplayLayout = 'grid' | 'list';
export type ActiveTab = 'collection' | 'wishlist' | 'add' | 'stats' | 'loaned';

export interface MusicBrainzRelease {
  id: string;
  title: string;
  'artist-credit'?: Array<{ name: string; artist?: { id: string; name: string } }>;
  date?: string;
  country?: string;
  barcode?: string;
  'label-info-list'?: Array<{ label?: { name: string } }>;
  'track-count'?: number;
  'release-group'?: {
    id?: string;
    'primary-type'?: string;
    'secondary-types'?: string[];
  };
  media?: Array<{ 'track-count'?: number; format?: string; tracks?: Array<{ title: string; length?: number }> }>;
  genres?: Array<{ name: string }>;
  tags?: Array<{ name: string }>;
  disambiguation?: string;
}

export interface DuplicateCheckResult {
  hasDuplicateInCollection: boolean;
  hasDuplicateInWishlist: boolean;
  collectionMatches: CDItem[];
  wishlistMatches: CDItem[];
}
