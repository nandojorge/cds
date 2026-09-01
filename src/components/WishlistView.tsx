import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  Check, 
  Search, 
  LayoutGrid, 
  List as ListIcon, 
  Users, 
  Disc, 
  ChevronRight, 
  ChevronDown, 
  Trash2,
  Radio
} from 'lucide-react';
import { CDItem, WishlistSortOption, WishlistViewMode, DisplayLayout, MediaFormat } from '../types';
import { CDCover } from './CDCover';

interface WishlistViewProps {
  wishlist: CDItem[];
  onMoveToCollection: (cd: CDItem) => void;
  onRemoveFromWishlist: (id: string) => void;
  onSelectCD: (cd: CDItem) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  wishlist,
  onMoveToCollection,
  onRemoveFromWishlist,
  onSelectCD,
}) => {
  const [viewMode, setViewMode] = useState<WishlistViewMode>('cds');
  const [layout, setLayout] = useState<DisplayLayout>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'all' | MediaFormat>('all');
  const [sortBy, setSortBy] = useState<WishlistSortOption>('recently_added');
  const [expandedBands, setExpandedBands] = useState<Record<string, boolean>>({});

  // Toggle band expansion in bands view
  const toggleBand = (artist: string) => {
    setExpandedBands((prev) => ({
      ...prev,
      [artist]: !prev[artist],
    }));
  };

  // Filter items based on in-wishlist search & format
  const filteredWishlist = useMemo(() => {
    let list = [...wishlist];

    // Format filter
    if (selectedFormat !== 'all') {
      list = list.filter((item) => (item.mediaFormat || 'CD') === selectedFormat);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.artist.toLowerCase().includes(q)
      );
    }

    // Sort items
    list.sort((a, b) => {
      switch (sortBy) {
        case 'artist_asc':
          return a.artist.localeCompare(b.artist);
        case 'artist_desc':
          return b.artist.localeCompare(a.artist);
        case 'album_asc':
          return a.title.localeCompare(b.title);
        case 'year':
          return (b.year || 0) - (a.year || 0);
        case 'recently_added':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case 'oldest_added':
          return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        default:
          return 0;
      }
    });

    return list;
  }, [wishlist, searchTerm, sortBy, selectedFormat]);

  // Group by Band/Artist for the Bandas view
  const groupedByBand = useMemo(() => {
    const map = new Map<string, CDItem[]>();
    for (const item of filteredWishlist) {
      const current = map.get(item.artist) || [];
      current.push(item);
      map.set(item.artist, current);
    }

    const entries = Array.from(map.entries()).map(([artist, cds]) => ({
      artist,
      cds,
      count: cds.length,
    }));

    if (sortBy === 'artist_desc') {
      return entries.sort((a, b) => b.artist.localeCompare(a.artist));
    } else if (sortBy === 'artist_asc') {
      return entries.sort((a, b) => a.artist.localeCompare(b.artist));
    }
    return entries.sort((a, b) => b.count - a.count || a.artist.localeCompare(b.artist));
  }, [filteredWishlist, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E4E7] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FFE4E6] border border-[#FECDD3] text-[#E11D48]">
              <Heart className="w-5 h-5 fill-[#E11D48]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#09090B] tracking-tight flex items-center gap-2">
                Lista de Desejos
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3]">
                  {wishlist.length} {wishlist.length === 1 ? 'item' : 'itens'}
                </span>
              </h2>
              <p className="text-xs text-[#71717A] font-medium">
                CDs e Vinis que pretendes comprar para acrescentar ao teu arquivo físico.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, View Mode (Bandas / Álbuns), Format, Sort & Layout */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E4E4E7] shadow-xs">
        
        {/* Search inside Wishlist */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar banda ou álbum na lista de desejos..."
            className="w-full pl-9 pr-8 py-2 bg-[#F4F4F5] text-xs text-[#18181B] placeholder-[#A1A1AA] font-medium rounded-lg border border-[#E4E4E7] focus:border-[#18181B] focus:bg-white outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#71717A] hover:text-[#18181B]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters and View Switches */}
        <div className="flex items-center gap-2.5 flex-wrap justify-between lg:justify-end">
          
          {/* Organization: [ Álbuns ] [ Bandas ] segmented control */}
          <div className="flex bg-[#F4F4F5] p-1 rounded-lg border border-[#E4E4E7]">
            <button
              onClick={() => setViewMode('cds')}
              className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                viewMode === 'cds'
                  ? 'bg-white text-[#18181B] shadow-xs'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Itens</span>
            </button>
            <button
              onClick={() => setViewMode('bands')}
              className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                viewMode === 'bands'
                  ? 'bg-white text-[#18181B] shadow-xs'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Bandas</span>
            </button>
          </div>

          {/* Format Filter */}
          {viewMode === 'cds' && (
            <div className="flex bg-[#F4F4F5] p-1 rounded-lg border border-[#E4E4E7]">
              <button
                onClick={() => setSelectedFormat('all')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  selectedFormat === 'all' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedFormat('CD')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  selectedFormat === 'CD' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <Disc className="w-3 h-3" />
                <span>CD</span>
              </button>
              <button
                onClick={() => setSelectedFormat('Vinyl')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  selectedFormat === 'Vinyl' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>Vinil</span>
              </button>
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as WishlistSortOption)}
              className="text-xs font-semibold bg-white text-[#18181B] border border-[#E4E4E7] rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:border-[#18181B] transition-colors"
            >
              <option value="recently_added">Adicionados recentemente</option>
              <option value="oldest_added">Adicionados há mais tempo</option>
              <option value="artist_asc">Banda A-Z</option>
              <option value="artist_desc">Banda Z-A</option>
              <option value="album_asc">Álbum A-Z</option>
              <option value="year">Ano</option>
            </select>
          </div>

          {/* Layout Toggle (Grid / List) for items view */}
          {viewMode === 'cds' && (
            <div className="flex items-center p-0.5 bg-[#F4F4F5] rounded-lg border border-[#E4E4E7]">
              <button
                onClick={() => setLayout('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  layout === 'grid' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
                }`}
                title="Grelha"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLayout('list')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  layout === 'list' ? 'bg-white text-[#18181B] shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
                }`}
                title="Lista"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredWishlist.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#E4E4E7] shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#FFE4E6] border border-[#FECDD3] flex items-center justify-center text-[#E11D48] mb-3">
            <Heart className="w-7 h-7 fill-[#E11D48]" />
          </div>
          <h3 className="text-base font-bold text-[#18181B]">A tua Lista de Desejos está vazia</h3>
          <p className="text-xs text-[#71717A] max-w-sm mx-auto mt-1">
            {searchTerm
              ? 'Nenhum item encontrado com os termos de pesquisa atuais.'
              : 'Usa o botão no topo para pesquisar álbuns e guardá-los na tua lista de desejos.'}
          </p>
        </div>
      ) : viewMode === 'bands' ? (
        /* VISTA ORGANIZAÇÃO POR BANDAS */
        <div className="space-y-4">
          {groupedByBand.map(({ artist, cds, count }) => {
            const isExpanded = expandedBands[artist] !== false;

            return (
              <div
                key={artist}
                className="bg-white border border-[#E4E4E7] rounded-xl overflow-hidden shadow-xs transition-all"
              >
                {/* Band Header Row */}
                <div
                  onClick={() => toggleBand(artist)}
                  className="flex items-center justify-between p-4 bg-[#FAFAFA] hover:bg-[#F4F4F5] cursor-pointer select-none transition-colors border-b border-[#E4E4E7]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#E4E4E7] flex items-center justify-center text-[#18181B] font-bold text-xs shadow-xs">
                      <Users className="w-4 h-4 text-[#E11D48]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
                        {artist}
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3]">
                          {count} {count === 1 ? 'item desejado' : 'itens desejados'}
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#71717A]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#71717A]" />
                    )}
                  </div>
                </div>

                {/* Expanded Band Albums */}
                {isExpanded && (
                  <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {cds.map((cd) => (
                      <WishlistCard
                        key={cd.id}
                        cd={cd}
                        onMoveToCollection={onMoveToCollection}
                        onRemoveFromWishlist={onRemoveFromWishlist}
                        onSelectCD={onSelectCD}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : layout === 'grid' ? (
        /* VISTA ITENS: GRELHA */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredWishlist.map((cd) => (
            <WishlistCard
              key={cd.id}
              cd={cd}
              onMoveToCollection={onMoveToCollection}
              onRemoveFromWishlist={onRemoveFromWishlist}
              onSelectCD={onSelectCD}
            />
          ))}
        </div>
      ) : (
        /* VISTA ITENS: LISTA */
        <div className="space-y-2">
          {filteredWishlist.map((cd) => (
            <WishlistRow
              key={cd.id}
              cd={cd}
              onMoveToCollection={onMoveToCollection}
              onRemoveFromWishlist={onRemoveFromWishlist}
              onSelectCD={onSelectCD}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* Individual Wishlist Card (Grid) */
interface WishlistCardProps {
  cd: CDItem;
  onMoveToCollection: (cd: CDItem) => void;
  onRemoveFromWishlist: (id: string) => void;
  onSelectCD: (cd: CDItem) => void;
}

const WishlistCard: React.FC<WishlistCardProps> = ({
  cd,
  onMoveToCollection,
  onRemoveFromWishlist,
  onSelectCD,
}) => {
  return (
    <div
      onClick={() => onSelectCD(cd)}
      className="group relative bg-white rounded-xl p-3 border border-[#E4E4E7] hover:border-[#18181B] transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-sm"
    >
      <div>
        {/* Cover + Overlay Badges */}
        <div className="relative mb-2.5 flex justify-center">
          <CDCover
            coverUrl={cd.coverUrl}
            title={cd.title}
            artist={cd.artist}
            year={cd.year}
            size="lg"
            className="w-full aspect-square"
          />

          {/* Badge: Format indicator */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
            <span className="flex items-center gap-1 text-[10px] font-bold bg-white/95 text-[#18181B] px-2 py-0.5 rounded-full border border-[#E4E4E7] backdrop-blur-xs shadow-2xs">
              {cd.mediaFormat === 'Vinyl' ? 'Vinil' : 'CD'}
            </span>
          </div>

          {/* Desired Price Pill if present */}
          {cd.desiredPrice && (
            <div className="absolute top-2 right-2 z-10">
              <span className="text-[10px] font-mono font-bold bg-white/95 text-[#059669] px-2 py-0.5 rounded-full border border-[#A7F3D0] backdrop-blur-xs shadow-2xs">
                {cd.desiredPrice}
              </span>
            </div>
          )}
        </div>

        {/* Album Meta */}
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-[#18181B] truncate leading-tight">
            {cd.title}
          </h4>
          <p className="text-xs text-[#71717A] font-medium truncate">{cd.artist}</p>

          <div className="flex items-center gap-1.5 text-[10px] pt-1 flex-wrap">
            {cd.year > 0 && (
              <span className="font-mono font-bold text-[#71717A] bg-[#F4F4F5] px-1.5 py-0.5 rounded border border-[#E4E4E7]">
                {cd.year}
              </span>
            )}
          </div>

          {/* Purchase notes snippet */}
          {cd.purchaseNotes && (
            <div className="mt-2 text-[11px] text-[#71717A] bg-[#F4F4F5] p-2 rounded-lg border border-[#E4E4E7] line-clamp-2 italic">
              "{cd.purchaseNotes}"
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action: "✓ Já comprei" button */}
      <div className="mt-3.5 pt-2.5 border-t border-[#E4E4E7] flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveToCollection(cd);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          title="Passar automaticamente para a coleção"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Já comprei</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromWishlist(cd.id);
          }}
          className="p-2 text-[#A1A1AA] hover:text-[#E11D48] hover:bg-[#FFE4E6] rounded-lg transition-colors cursor-pointer"
          title="Remover da Lista de Desejos"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* Individual Wishlist Row (List View) */
const WishlistRow: React.FC<WishlistCardProps> = ({
  cd,
  onMoveToCollection,
  onRemoveFromWishlist,
  onSelectCD,
}) => {
  return (
    <div
      onClick={() => onSelectCD(cd)}
      className="group bg-white hover:bg-[#FAFAFA] p-3 rounded-xl border border-[#E4E4E7] hover:border-[#18181B] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <CDCover
          coverUrl={cd.coverUrl}
          title={cd.title}
          artist={cd.artist}
          year={cd.year}
          size="sm"
          className="w-13 h-13"
        />

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-sm text-[#18181B] truncate">
              {cd.title}
            </h4>
            <span className="text-[10px] font-bold bg-[#F4F4F5] text-[#18181B] px-1.5 py-0.5 rounded border border-[#E4E4E7]">
              {cd.mediaFormat === 'Vinyl' ? 'Vinil' : 'CD'}
            </span>
            {cd.year > 0 && (
              <span className="text-[10px] font-mono font-bold text-[#71717A] bg-[#F4F4F5] px-1.5 py-0.5 rounded border border-[#E4E4E7]">
                {cd.year}
              </span>
            )}
          </div>
          <p className="text-xs text-[#71717A] font-medium truncate">{cd.artist}</p>
          
          {cd.purchaseNotes && (
            <p className="text-[11px] text-[#71717A] italic truncate max-w-md">
              Nota: {cd.purchaseNotes}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E4E4E7]">
        {cd.desiredPrice && (
          <span className="text-xs font-mono font-bold text-[#059669] bg-[#ECFDF5] px-2 py-1 rounded-md border border-[#A7F3D0]">
            {cd.desiredPrice}
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveToCollection(cd);
          }}
          className="flex items-center gap-1.5 py-1.5 px-3 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Já comprei</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromWishlist(cd.id);
          }}
          className="p-1.5 text-[#A1A1AA] hover:text-[#E11D48] hover:bg-[#FFE4E6] rounded-lg transition-colors cursor-pointer"
          title="Remover"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
